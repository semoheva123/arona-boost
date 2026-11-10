const crypto = require('crypto');

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_USDT_HEX_NO_PREFIX = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c';
const BSC_USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_EVENT_TOPIC0 =
  'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function encodeBase58(buffer) {
  if (!buffer || buffer.length === 0) return '';
  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leadingZeros = '';
  for (let k = 0; k < buffer.length && buffer[k] === 0; k++) {
    leadingZeros += '1';
  }
  return (
    leadingZeros +
    digits
      .reverse()
      .map((d) => BASE58_ALPHABET[d])
      .join('')
  );
}

function tronHexToBase58(rawHex = '') {
  const clean = String(rawHex).replace(/^0x/i, '').toLowerCase();
  const addr20 = clean.length >= 40 ? clean.slice(-40) : clean.padStart(40, '0');
  const payload = Buffer.from('41' + addr20, 'hex');
  const checksum = sha256(sha256(payload)).subarray(0, 4);
  return encodeBase58(Buffer.concat([payload, checksum]));
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function extractTxHash64(rawInput = '') {
  const s = String(rawInput || '').trim();
  if (!s) return '';
  const match = s.match(/(?:0x)?([0-9a-fA-F]{64})(?![0-9a-fA-F])/);
  return match ? match[1].toLowerCase() : '';
}

function validateCryptoWalletFormat(addr = '', network = 'TRC20') {
  const clean = String(addr || '').trim();
  if (network === 'BEP20') {
    return /^0x[0-9a-fA-F]{40}$/.test(clean);
  }
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(clean);
}

async function verifyTronTrc20({ txid, expectedAmount, expectedWallet, maxAgeHours = 72 }) {
  const extracted = extractTxHash64(txid);
  const cleanHash = extracted || String(txid || '').trim().replace(/^0x/i, '');
  const explorerUrl = `https://tronscan.org/#/transaction/${cleanHash}`;

  if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: false,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      isFreshTx: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr:
        'صيغة معرّف TXID غير صحيحة لشبكة TRON (يجب لصق معرّف التحويل المكوّن من 64 حرفاً ورقماً أو رابط TronScan)'
    };
  }

  let foundOnChain = false;
  let txSuccess = false;
  let contractRet = 'UNKNOWN';
  let logs = [];
  let blockTimestampMs = 0;
  let hadRpcSuccess = false;

  // Provider 1: PublicNode TRON JSON-RPC (/jsonrpc) — fast single-call receipt + logs with no strict 1-rps rate limit
  try {
    const rpcRes = await fetch('https://tron-rpc.publicnode.com/jsonrpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: ['0x' + cleanHash]
      }),
      signal: AbortSignal.timeout(7000)
    });
    if (rpcRes.ok) {
      const rpcJson = await rpcRes.json().catch(() => ({}));
      if (!rpcJson?.error) {
        hadRpcSuccess = true;
        const receipt = rpcJson?.result;
        if (receipt) {
          foundOnChain = true;
          txSuccess = receipt.status === '0x1';
          contractRet = txSuccess ? 'SUCCESS' : 'REVERT';
          logs = Array.isArray(receipt.logs) ? receipt.logs : [];
          if (receipt.blockNumber) {
            const blkRes = await fetch('https://tron-rpc.publicnode.com/jsonrpc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_getBlockByNumber',
                params: [receipt.blockNumber, false]
              }),
              signal: AbortSignal.timeout(5000)
            }).catch(() => null);
            const blk = blkRes ? (await blkRes.json().catch(() => ({})))?.result : null;
            if (blk?.timestamp) blockTimestampMs = parseInt(blk.timestamp, 16) * 1000;
          }
        }
      }
    }
  } catch {
    // fallback to TronGrid below
  }

  // Provider 2 Failover: TronGrid official HTTP API (whenever receipt not found or logs missing)
  if (!foundOnChain || logs.length === 0) {
    try {
      const [infoRes, txRes] = await Promise.all([
        fetch('https://api.trongrid.io/wallet/gettransactioninfobyid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: cleanHash }),
          signal: AbortSignal.timeout(7000)
        }),
        fetch('https://api.trongrid.io/wallet/gettransactionbyid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: cleanHash }),
          signal: AbortSignal.timeout(7000)
        })
      ]);
      if (infoRes.ok) {
        const info = await infoRes.json().catch(() => ({}));
        const tx = txRes.ok ? await txRes.json().catch(() => ({})) : {};
        if (info && info.id) {
          hadRpcSuccess = true;
          foundOnChain = true;
          contractRet = info?.receipt?.result || tx?.ret?.[0]?.contractRet || 'UNKNOWN';
          txSuccess = contractRet === 'SUCCESS';
          if (Array.isArray(info.log) && info.log.length > 0) logs = info.log;
          if (!blockTimestampMs)
            blockTimestampMs = Number(info?.blockTimeStamp || tx?.raw_data?.timestamp || 0);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!hadRpcSuccess && !foundOnChain) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: true,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      isFreshTx: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'network_error',
      summaryAr: 'تعذر الاتصال المؤقت بعقدة بلوكتشين TRON، تم حفظ الطلب للمراجعة الآلية'
    };
  }

  if (!foundOnChain) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: true,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      isFreshTx: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'not_found',
      summaryAr:
        'لم يتم العثور على هذا الـ TXID على بلوكتشين TRON — تأكد من الرقم أو انتظر 30 ثانية لتأكيد الشبكة إن أرسلت للتو'
    };
  }

  let matchedTransfer = null;
  const cleanExpectedWallet = String(expectedWallet || '').trim();
  for (const lg of logs) {
    const contractHex = String(lg.address || '').replace(/^0x|^41/i, '').toLowerCase();
    const topics = Array.isArray(lg.topics) ? lg.topics : [];
    const topic0 = String(topics[0] || '').replace(/^0x/i, '').toLowerCase();
    if (
      contractHex === TRON_USDT_HEX_NO_PREFIX &&
      topic0 === TRANSFER_EVENT_TOPIC0 &&
      topics.length >= 3
    ) {
      const fromAddr = tronHexToBase58(topics[1]);
      const toAddr = tronHexToBase58(topics[2]);
      const rawHexData = String(lg.data || '0').replace(/^0x/i, '') || '0';
      const usdtVal = Number(BigInt('0x' + rawHexData)) / 1e6;
      matchedTransfer = {
        fromAddress: fromAddr,
        toAddress: toAddr,
        onChainAmount: round2(usdtVal)
      };
      if (toAddr === cleanExpectedWallet) break;
    }
  }

  if (!matchedTransfer) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: true,
      foundOnChain: true,
      txSuccess,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      isFreshTx: true,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet: cleanExpectedWallet,
      explorerUrl,
      statusBadge: 'mismatch',
      summaryAr: txSuccess
        ? 'المعاملة موجودة على TRON ولكنها ليست تحويل عملة USDT (TRC20) رسمية'
        : `المعاملة فاشلة على بلوكتشين TRON (${contractRet})`
    };
  }

  const recipientMatches = matchedTransfer.toAddress.trim() === cleanExpectedWallet;
  const feeTolerance = Math.max(2.0, Number(expectedAmount || 0) * 0.05);
  const amountMatches =
    Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= feeTolerance;
  const ageHours = blockTimestampMs > 0 ? (Date.now() - blockTimestampMs) / 3600000 : 0;
  const isFreshTx = !(maxAgeHours > 0 && blockTimestampMs > 0 && ageHours > maxAgeHours);
  const fullyVerified = txSuccess && recipientMatches && amountMatches && isFreshTx;

  const summaryAr = fullyVerified
    ? `تم التحقق بنجاح على TRON: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(2)} USDT إلى عنوان الإيداع الموحّد`
    : !txSuccess
    ? `المعاملة فاشلة على الشبكة (${contractRet})`
    : !recipientMatches
    ? `عنوان المستلم في هذه المعاملة (${matchedTransfer.toAddress.slice(0, 8)}...) لا يطابق عنوان الإيداع الثابت للمنصة!`
    : !isFreshTx
    ? `هذه المعاملة قديمة على الشبكة (مضى عليها أكثر من ${maxAgeHours} ساعة) ولا يُسمح بإعادة استخدامها`
    : `المبلغ الفعلي المستلم على الشبكة ($${matchedTransfer.onChainAmount.toFixed(2)} USDT) لا يطابق المبلغ المدخل ($${Number(expectedAmount || 0).toFixed(2)} USDT) — يرجى إدخال المبلغ الصافي الفعلي`;

  return {
    checkedAt: new Date().toISOString(),
    network: 'TRC20',
    txid: cleanHash,
    validFormat: true,
    foundOnChain: true,
    txSuccess,
    isUsdtTransfer: true,
    recipientMatches,
    amountMatches,
    isFreshTx,
    blockTimestampMs: blockTimestampMs || null,
    fullyVerified,
    onChainAmount: matchedTransfer.onChainAmount,
    expectedAmount,
    fromAddress: matchedTransfer.fromAddress,
    toAddress: matchedTransfer.toAddress,
    expectedWallet: cleanExpectedWallet,
    explorerUrl,
    statusBadge: fullyVerified ? 'verified' : !isFreshTx ? 'expired_tx' : 'mismatch',
    summaryAr
  };
}

async function verifyBscBep20({ txid, expectedAmount, expectedWallet, maxAgeHours = 72 }) {
  const extracted = extractTxHash64(txid);
  const cleanNoPrefix = extracted || String(txid || '').trim().replace(/^0x/i, '');
  const fullHash = '0x' + cleanNoPrefix;
  const explorerUrl = `https://bscscan.com/tx/${fullHash}`;

  if (!/^[0-9a-fA-F]{64}$/.test(cleanNoPrefix)) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'BEP20',
      txid: fullHash,
      validFormat: false,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      isFreshTx: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr:
        'صيغة معرّف TXID غير صحيحة لشبكة BSC BEP20 (يجب لصق معرّف التحويل المكوّن من 64 حرفاً ورقماً أو رابط BscScan)'
    };
  }

  const cleanExpectedLower = String(expectedWallet || '').trim().toLowerCase();
  for (const rpcUrl of [
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org',
    'https://1rpc.io/bnb'
  ]) {
    try {
      const rpcRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [fullHash]
        }),
        signal: AbortSignal.timeout(7000)
      });
      if (!rpcRes.ok) continue;
      const rpcJson = await rpcRes.json();
      if (rpcJson?.error) continue;
      const receipt = rpcJson?.result;
      if (!receipt) {
        return {
          checkedAt: new Date().toISOString(),
          network: 'BEP20',
          txid: fullHash,
          validFormat: true,
          foundOnChain: false,
          txSuccess: false,
          isUsdtTransfer: false,
          recipientMatches: false,
          amountMatches: false,
          isFreshTx: false,
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: null,
          toAddress: null,
          expectedWallet,
          explorerUrl,
          statusBadge: 'not_found',
          summaryAr:
            'لم يتم العثور على هذا الـ TXID على شبكة BNB Smart Chain (BEP20) — تأكد من الشبكة أو انتظر تأكيد البلوكشين'
        };
      }
      const txSuccess = receipt.status === '0x1';
      let blockTimestampMs = 0;
      if (receipt.blockNumber) {
        const blkRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_getBlockByNumber',
            params: [receipt.blockNumber, false]
          }),
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        const blk = blkRes ? (await blkRes.json().catch(() => ({})))?.result : null;
        if (blk?.timestamp) blockTimestampMs = parseInt(blk.timestamp, 16) * 1000;
      }

      let matchedTransfer = null;
      for (const lg of Array.isArray(receipt.logs) ? receipt.logs : []) {
        const contractAddr = String(lg.address || '').toLowerCase();
        const topics = Array.isArray(lg.topics) ? lg.topics : [];
        const topic0 = String(topics[0] || '').replace(/^0x/i, '').toLowerCase();
        if (
          contractAddr === BSC_USDT_CONTRACT &&
          topic0 === TRANSFER_EVENT_TOPIC0 &&
          topics.length >= 3
        ) {
          const fromAddr = '0x' + topics[1].slice(-40).toLowerCase();
          const toAddr = '0x' + topics[2].slice(-40).toLowerCase();
          const scaled = Number(BigInt(lg.data || '0x0') / 100000000000000n) / 10000;
          matchedTransfer = {
            fromAddress: fromAddr,
            toAddress: toAddr,
            onChainAmount: round2(scaled)
          };
          if (toAddr === cleanExpectedLower) break;
        }
      }

      if (!matchedTransfer) {
        return {
          checkedAt: new Date().toISOString(),
          network: 'BEP20',
          txid: fullHash,
          validFormat: true,
          foundOnChain: true,
          txSuccess,
          isUsdtTransfer: false,
          recipientMatches: false,
          amountMatches: false,
          isFreshTx: true,
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: null,
          toAddress: null,
          expectedWallet,
          explorerUrl,
          statusBadge: 'mismatch',
          summaryAr: 'المعاملة موجودة على BSC ولكنها لا تتضمن تحويل عملة USDT (BEP20) رسمية'
        };
      }

      const recipientMatches = matchedTransfer.toAddress === cleanExpectedLower;
      const feeTolerance = Math.max(2.0, Number(expectedAmount || 0) * 0.05);
      const amountMatches =
        Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= feeTolerance;
      const ageHours = blockTimestampMs > 0 ? (Date.now() - blockTimestampMs) / 3600000 : 0;
      const isFreshTx = !(maxAgeHours > 0 && blockTimestampMs > 0 && ageHours > maxAgeHours);
      const fullyVerified = txSuccess && recipientMatches && amountMatches && isFreshTx;

      const summaryAr = fullyVerified
        ? `تم التحقق بنجاح على BSC: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(2)} USDT إلى عنوان الإيداع الموحّد`
        : !txSuccess
        ? 'المعاملة مرفوضة/فاشلة على شبكة BSC'
        : !recipientMatches
        ? `عنوان المستلم في هذه المعاملة (${matchedTransfer.toAddress.slice(0, 10)}...) لا يطابق عنوان الإيداع الثابت للمنصة!`
        : !isFreshTx
        ? `هذه المعاملة قديمة على الشبكة (مضى عليها أكثر من ${maxAgeHours} ساعة) ولا يُسمح بإعادة استخدامها`
        : `المبلغ الفعلي المستلم على الشبكة ($${matchedTransfer.onChainAmount.toFixed(2)} USDT) لا يطابق المبلغ المدخل ($${Number(expectedAmount || 0).toFixed(2)} USDT) — يرجى إدخال المبلغ الصافي الفعلي`;

      return {
        checkedAt: new Date().toISOString(),
        network: 'BEP20',
        txid: fullHash,
        validFormat: true,
        foundOnChain: true,
        txSuccess,
        isUsdtTransfer: true,
        recipientMatches,
        amountMatches,
        isFreshTx,
        blockTimestampMs: blockTimestampMs || null,
        fullyVerified,
        onChainAmount: matchedTransfer.onChainAmount,
        expectedAmount,
        fromAddress: matchedTransfer.fromAddress,
        toAddress: matchedTransfer.toAddress,
        expectedWallet,
        explorerUrl,
        statusBadge: fullyVerified ? 'verified' : !isFreshTx ? 'expired_tx' : 'mismatch',
        summaryAr
      };
    } catch {
      // try next RPC
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    network: 'BEP20',
    txid: fullHash,
    validFormat: true,
    foundOnChain: false,
    txSuccess: false,
    isUsdtTransfer: false,
    recipientMatches: false,
    amountMatches: false,
    isFreshTx: false,
    fullyVerified: false,
    onChainAmount: null,
    expectedAmount,
    fromAddress: null,
    toAddress: null,
    expectedWallet,
    explorerUrl,
    statusBadge: 'network_error',
    summaryAr: 'تعذر الاتصال المؤقت بعقدة BSC، تم حفظ الطلب للمراجعة الآلية'
  };
}

async function verifyTransactionOnChain({
  txid,
  network = 'TRC20',
  expectedAmount = 0,
  expectedWallet = '',
  maxAgeHours = 72
}) {
  if (network === 'BEP20') {
    return verifyBscBep20({ txid, expectedAmount, expectedWallet, maxAgeHours });
  }
  return verifyTronTrc20({ txid, expectedAmount, expectedWallet, maxAgeHours });
}

module.exports = {
  tronHexToBase58,
  extractTxHash64,
  validateCryptoWalletFormat,
  TRON_USDT_CONTRACT,
  BSC_USDT_CONTRACT,
  verifyTransactionOnChain
};
