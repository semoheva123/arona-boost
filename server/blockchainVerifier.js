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

/**
 * Converts a 20-byte EVM/TVM hex address (or 32-byte log topic) into a TRON Base58Check address (T...)
 */
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

/**
 * Verify a TRC20 USDT transaction on the live TRON mainnet via TronGrid API
 */
async function verifyTronTrc20({ txid, expectedAmount, expectedWallet }) {
  const cleanHash = String(txid || '').trim().replace(/^0x/i, '');
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
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr:
        'صيغة معرّف TXID غير مطابقة لشبكة TRON (يجب أن يتكون من 64 محرفاً سداسياً عشرياً)'
    };
  }

  try {
    const [infoRes, txRes] = await Promise.all([
      fetch('https://api.trongrid.io/wallet/gettransactioninfobyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanHash }),
        signal: AbortSignal.timeout(9000)
      }),
      fetch('https://api.trongrid.io/wallet/gettransactionbyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanHash }),
        signal: AbortSignal.timeout(9000)
      })
    ]);

    const info = await infoRes.json();
    const tx = await txRes.json();

    if ((!info || !info.id) && (!tx || !tx.txID)) {
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
        fullyVerified: false,
        onChainAmount: null,
        expectedAmount,
        fromAddress: null,
        toAddress: null,
        expectedWallet,
        explorerUrl,
        statusBadge: 'not_found',
        summaryAr: 'لم يتم العثور على هذه المعاملة على بلوكتشين TRON حتى الآن'
      };
    }

    const contractRet =
      info?.receipt?.result || tx?.ret?.[0]?.contractRet || 'UNKNOWN';
    const txSuccess = contractRet === 'SUCCESS';

    const logs = Array.isArray(info?.log) ? info.log : [];
    let matchedTransfer = null;

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
        const rawUnits = BigInt('0x' + rawHexData);
        const usdtVal = Number(rawUnits) / 1e6;

        matchedTransfer = {
          fromAddress: fromAddr,
          toAddress: toAddr,
          onChainAmount: round2(usdtVal)
        };

        if (toAddr === expectedWallet) {
          break;
        }
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
        fullyVerified: false,
        onChainAmount: null,
        expectedAmount,
        fromAddress: null,
        toAddress: null,
        expectedWallet,
        blockNumber: info?.blockNumber || null,
        explorerUrl,
        statusBadge: 'mismatch',
        summaryAr: txSuccess
          ? 'المعاملة موجودة على TRON ولكنها ليست تحويل عملة USDT (TRC20) رسمية'
          : `المعاملة موجودة على TRON لكن حالتها (${contractRet})`
      };
    }

    const recipientMatches =
      matchedTransfer.toAddress.trim() === String(expectedWallet || '').trim();
    const amountMatches =
      matchedTransfer.onChainAmount + 0.05 >= Number(expectedAmount || 0) &&
      Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= 1.0;
    const fullyVerified = txSuccess && recipientMatches && amountMatches;

    let summaryAr = '';
    if (fullyVerified) {
      summaryAr = `تم التحقق بنجاح على TRON: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(
        2
      )} USDT إلى محفظة المنصة`;
    } else if (!txSuccess) {
      summaryAr = `المعاملة فاشلة على الشبكة (${contractRet})`;
    } else if (!recipientMatches) {
      summaryAr = `تنبيه: المستلم على الشبكة (${matchedTransfer.toAddress.slice(
        0,
        8
      )}...) لا يطابق محفظة المنصة!`;
    } else {
      summaryAr = `تنبيه: المبلغ الفعلي على الشبكة ($${matchedTransfer.onChainAmount.toFixed(
        2
      )} USDT) يختلف عن المبلغ المدخل ($${Number(expectedAmount).toFixed(2)})`;
    }

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
      fullyVerified,
      onChainAmount: matchedTransfer.onChainAmount,
      expectedAmount,
      fromAddress: matchedTransfer.fromAddress,
      toAddress: matchedTransfer.toAddress,
      expectedWallet,
      blockNumber: info?.blockNumber || null,
      explorerUrl,
      statusBadge: fullyVerified ? 'verified' : 'mismatch',
      summaryAr
    };
  } catch (err) {
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
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'network_error',
      summaryAr: 'تعذر الاتصال المؤقت بعقدة TRON، يرجى إعادة الفحص بعد لحظات'
    };
  }
}

/**
 * Verify a BEP20 USDT transaction on BNB Smart Chain mainnet via JSON-RPC
 */
async function verifyBscBep20({ txid, expectedAmount, expectedWallet }) {
  const cleanNoPrefix = String(txid || '').trim().replace(/^0x/i, '');
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
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr:
        'صيغة معرّف TXID غير مطابقة لشبكة BSC BEP20 (يجب أن يتكون من 64 محرفاً سداسياً عشرياً)'
    };
  }

  const rpcEndpoints = [
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org'
  ];

  for (const rpcUrl of rpcEndpoints) {
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
        signal: AbortSignal.timeout(9000)
      });

      const rpcData = await rpcRes.json();
      const receipt = rpcData?.result;

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
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: null,
          toAddress: null,
          expectedWallet,
          explorerUrl,
          statusBadge: 'not_found',
          summaryAr: 'لم يتم العثور على هذه المعاملة على شبكة BNB Smart Chain (BEP20)'
        };
      }

      const txSuccess = receipt.status === '0x1';
      const logs = Array.isArray(receipt.logs) ? receipt.logs : [];
      let matchedTransfer = null;

      for (const lg of logs) {
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
          const rawWei = BigInt(lg.data || '0x0');
          // 18 decimals for BSC-USD -> divide by 1e14 first to keep 4 decimals safely
          const scaled = Number(rawWei / 100000000000000n) / 10000;

          matchedTransfer = {
            fromAddress: fromAddr,
            toAddress: toAddr,
            onChainAmount: round2(scaled)
          };

          if (toAddr === String(expectedWallet || '').trim().toLowerCase()) {
            break;
          }
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
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: receipt.from || null,
          toAddress: receipt.to || null,
          expectedWallet,
          blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
          explorerUrl,
          statusBadge: 'mismatch',
          summaryAr: 'المعاملة موجودة على BSC ولكنها لا تتضمن تحويل عملة USDT (BEP20) رسمية'
        };
      }

      const recipientMatches =
        matchedTransfer.toAddress === String(expectedWallet || '').trim().toLowerCase();
      const amountMatches =
        matchedTransfer.onChainAmount + 0.05 >= Number(expectedAmount || 0) &&
        Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= 1.0;
      const fullyVerified = txSuccess && recipientMatches && amountMatches;

      let summaryAr = '';
      if (fullyVerified) {
        summaryAr = `تم التحقق بنجاح على BSC: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(
          2
        )} USDT إلى محفظة المنصة`;
      } else if (!txSuccess) {
        summaryAr = 'المعاملة مرفوضة/فاشلة على شبكة BSC';
      } else if (!recipientMatches) {
        summaryAr = `تنبيه: المستلم على الشبكة (${matchedTransfer.toAddress.slice(
          0,
          10
        )}...) لا يطابق محفظة المنصة!`;
      } else {
        summaryAr = `تنبيه: المبلغ الفعلي على الشبكة ($${matchedTransfer.onChainAmount.toFixed(
          2
        )} USDT) يختلف عن المبلغ المدخل ($${Number(expectedAmount).toFixed(2)})`;
      }

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
        fullyVerified,
        onChainAmount: matchedTransfer.onChainAmount,
        expectedAmount,
        fromAddress: matchedTransfer.fromAddress,
        toAddress: matchedTransfer.toAddress,
        expectedWallet,
        blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : null,
        explorerUrl,
        statusBadge: fullyVerified ? 'verified' : 'mismatch',
        summaryAr
      };
    } catch {
      // try fallback RPC
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
    fullyVerified: false,
    onChainAmount: null,
    expectedAmount,
    fromAddress: null,
    toAddress: null,
    expectedWallet,
    explorerUrl,
    statusBadge: 'network_error',
    summaryAr: 'تعذر الاتصال المؤقت بعقدة BSC، يرجى إعادة الفحص بعد لحظات'
  };
}

async function verifyTransactionOnChain({
  txid,
  network = 'TRC20',
  expectedAmount = 0,
  expectedWallet = ''
}) {
  if (network === 'BEP20') {
    return verifyBscBep20({ txid, expectedAmount, expectedWallet });
  }
  return verifyTronTrc20({ txid, expectedAmount, expectedWallet });
}

module.exports = {
  tronHexToBase58,
  TRON_USDT_CONTRACT,
  BSC_USDT_CONTRACT,
  verifyTransactionOnChain
};
