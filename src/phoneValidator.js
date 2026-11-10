export function normalizeDigits(raw = '') {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let out = String(raw || '').trim();
  out = out.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  out = out.replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
  out = out.replace(/[\s\-().]/g, '');
  if (out.startsWith('00')) {
    out = '+' + out.slice(2);
  }
  return out;
}

export const COUNTRY_RULES = [
  {
    code: '+963',
    iso: 'SY',
    countryAr: 'سوريا',
    lengths: [9],
    regex: /^9[345689]\d{7}$/,
    example: '991234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 93 أو 94 أو 95 أو 96 أو 98 أو 99',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '93' || p2 === '98') return 'Syriatel سيريتل';
      if (p2 === '94' || p2 === '95' || p2 === '99') return 'MTN سوريا';
      if (p2 === '96') return 'شبكة جوال سورية';
      return 'خط جوال سوري';
    }
  },
  {
    code: '+90',
    iso: 'TR',
    countryAr: 'تركيا',
    lengths: [10],
    regex: /^5[0-6]\d{8}$/,
    example: '5321234567',
    hintAr: '10 أرقام بعد الصفر ويبدأ بـ 50 أو 53 أو 54 أو 55',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '53') return 'Turkcell';
      if (p2 === '54') return 'Vodafone TR';
      if (p2 === '50' || p2 === '55') return 'Türk Telekom';
      return 'خط جوال تركي';
    }
  },
  {
    code: '+966',
    iso: 'SA',
    countryAr: 'السعودية',
    lengths: [9],
    regex: /^5[013456789]\d{7}$/,
    example: '501234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 5 (مثل 50، 53، 54، 55، 56، 58، 59)',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (['50', '53', '55'].includes(p2)) return 'stc السعودية';
      if (['54', '56'].includes(p2)) return 'Mobily موبايلي';
      if (['58', '59'].includes(p2)) return 'Zain زين السعودية';
      return 'خط جوال سعودي';
    }
  },
  {
    code: '+964',
    iso: 'IQ',
    countryAr: 'العراق',
    lengths: [10],
    regex: /^7[56789]\d{8}$/,
    example: '7712345678',
    hintAr: '10 أرقام بعد الصفر ويبدأ بـ 75 أو 77 أو 78 أو 79',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '77') return 'Asiacell آسيا سيل';
      if (p2 === '78' || p2 === '79') return 'Zain زين العراق';
      if (p2 === '75') return 'Korek كورك';
      return 'خط جوال عراقي';
    }
  },
  {
    code: '+962',
    iso: 'JO',
    countryAr: 'الأردن',
    lengths: [9],
    regex: /^7[789]\d{7}$/,
    example: '791234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 77 أو 78 أو 79',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '79') return 'Zain زين الأردن';
      if (p2 === '77') return 'Orange أورانج';
      if (p2 === '78') return 'Umniah أمنية';
      return 'خط جوال أردني';
    }
  },
  {
    code: '+20',
    iso: 'EG',
    countryAr: 'مصر',
    lengths: [10],
    regex: /^(10|11|12|15)\d{8}$/,
    example: '1012345678',
    hintAr: '10 أرقام بعد الصفر ويبدأ بـ 10 أو 11 أو 12 أو 15',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '10') return 'Vodafone فودافون مصر';
      if (p2 === '11') return 'e& اتصالات مصر';
      if (p2 === '12') return 'Orange أورانج مصر';
      if (p2 === '15') return 'WE المصرية للاتصالات';
      return 'خط جوال مصري';
    }
  },
  {
    code: '+971',
    iso: 'AE',
    countryAr: 'الإمارات',
    lengths: [9],
    regex: /^5[024568]\d{7}$/,
    example: '501234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 50 أو 52 أو 54 أو 55 أو 56 أو 58',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (['50', '54', '56'].includes(p2)) return 'e& اتصالات الإمارات';
      if (['52', '55', '58'].includes(p2)) return 'du دو';
      return 'خط جوال إماراتي';
    }
  },
  {
    code: '+961',
    iso: 'LB',
    countryAr: 'لبنان',
    lengths: [7, 8],
    regex: /^(3\d{6}|(70|71|76|78|79|81)\d{6})$/,
    example: '70123456',
    hintAr: '7 أرقام (يبدأ بـ 3) أو 8 أرقام (يبدأ بـ 70/71/76/78/79/81)',
    detectCarrier() {
      return 'Alfa / Touch لبنان';
    }
  },
  {
    code: '+965',
    iso: 'KW',
    countryAr: 'الكويت',
    lengths: [8],
    regex: /^[569]\d{7}$/,
    example: '50123456',
    hintAr: '8 أرقام ويبدأ بـ 5 أو 6 أو 9',
    detectCarrier() {
      return 'Zain / stc / Ooredoo الكويت';
    }
  },
  {
    code: '+974',
    iso: 'QA',
    countryAr: 'قطر',
    lengths: [8],
    regex: /^[3567]\d{7}$/,
    example: '55123456',
    hintAr: '8 أرقام ويبدأ بـ 3 أو 5 أو 6 أو 7',
    detectCarrier() {
      return 'Ooredoo / Vodafone قطر';
    }
  },
  {
    code: '+968',
    iso: 'OM',
    countryAr: 'سلطنة عُمان',
    lengths: [8],
    regex: /^[79]\d{7}$/,
    example: '91234567',
    hintAr: '8 أرقام ويبدأ بـ 7 أو 9',
    detectCarrier() {
      return 'Omantel / Ooredoo عُمان';
    }
  },
  {
    code: '+973',
    iso: 'BH',
    countryAr: 'البحرين',
    lengths: [8],
    regex: /^[36]\d{7}$/,
    example: '36123456',
    hintAr: '8 أرقام ويبدأ بـ 3 أو 6',
    detectCarrier() {
      return 'Batelco / Zain / stc البحرين';
    }
  },
  {
    code: '+218',
    iso: 'LY',
    countryAr: 'ليبيا',
    lengths: [9],
    regex: /^9[12345]\d{7}$/,
    example: '912345678',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 91 أو 92 أو 93 أو 94 أو 95',
    detectCarrier(nsn) {
      const p2 = nsn.slice(0, 2);
      if (p2 === '91' || p2 === '93') return 'المدار الجديد ليبيا';
      if (p2 === '92' || p2 === '94') return 'ليبيانا للهاتف المحمول';
      return 'خط جوال ليبي';
    }
  },
  {
    code: '+213',
    iso: 'DZ',
    countryAr: 'الجزائر',
    lengths: [9],
    regex: /^[567]\d{8}$/,
    example: '551234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 5 أو 6 أو 7',
    detectCarrier(nsn) {
      const p1 = nsn[0];
      if (p1 === '6') return 'Mobilis موبيليس';
      if (p1 === '7') return 'Djezzy جيزي';
      if (p1 === '5') return 'Ooredoo الجزائر';
      return 'خط جوال جزائري';
    }
  },
  {
    code: '+212',
    iso: 'MA',
    countryAr: 'المغرب',
    lengths: [9],
    regex: /^[67]\d{8}$/,
    example: '661234567',
    hintAr: '9 أرقام بعد الصفر ويبدأ بـ 6 أو 7',
    detectCarrier() {
      return 'اتصالات المغرب / Orange / inwi';
    }
  }
];

function checkSubscriberEntropy(nsn) {
  const tail = nsn.slice(2);
  if (/(\d)\1{5,}/.test(nsn)) {
    return {
      fake: true,
      reason: 'الرقم يحتوي على تكرار وهمي لنفس الرقم — يرجى إدخال رقم هاتف حقيقي فعّال'
    };
  }
  const asc = '01234567890';
  const desc = '09876543210';
  for (let i = 0; i <= nsn.length - 6; i++) {
    const chunk = nsn.slice(i, i + 6);
    if (asc.includes(chunk) || desc.includes(chunk)) {
      return {
        fake: true,
        reason: 'الأرقام المتسلسلة التجريبية (مثل 123456 أو 987654) غير مقبولة — أدخل رقمك الحقيقي'
      };
    }
  }
  if (/(\d\d)\1\1/.test(tail)) {
    return {
      fake: true,
      reason: 'الرقم يبدو بنمط متكرر غير حقيقي — يرجى إدخال رقم خط جوال صحيح'
    };
  }
  if (new Set(nsn.split('')).size < 3) {
    return {
      fake: true,
      reason: 'الرقم غير صحيح (تنوع الأرقام منخفض جداً ولا يطابق خطوط الاتصالات الحقيقية)'
    };
  }
  return { fake: false };
}

function resolveRuleAndSubscriber(rawInput, selectedCountryCode = '+963') {
  const cleaned = normalizeDigits(rawInput);
  if (!cleaned) return { empty: true };

  if (!/^\+?\d+$/.test(cleaned)) {
    return {
      invalidChars: true,
      error: 'يرجى إدخال أرقام فقط في حقل رقم الهاتف دون أحرف أو رموز'
    };
  }

  if (cleaned.startsWith('+')) {
    const sortedRules = [...COUNTRY_RULES].sort((a, b) => b.code.length - a.code.length);
    const matched = sortedRules.find((r) => cleaned.startsWith(r.code));
    if (matched) {
      let nsn = cleaned.slice(matched.code.length);
      if (nsn.startsWith('0')) nsn = nsn.replace(/^0+/, '');
      return { rule: matched, nsn, e164: `${matched.code}${nsn}` };
    }
    const digitsOnly = cleaned.slice(1);
    return { rule: null, nsn: digitsOnly, e164: cleaned, genericInternational: true };
  }

  if (selectedCountryCode && selectedCountryCode !== 'LOCAL') {
    const rule = COUNTRY_RULES.find((r) => r.code === selectedCountryCode);
    if (rule) {
      const bareCode = rule.code.slice(1);
      let nsn = cleaned;
      if (nsn.startsWith(bareCode) && nsn.length >= bareCode.length + Math.min(...rule.lengths)) {
        nsn = nsn.slice(bareCode.length);
      }
      nsn = nsn.replace(/^0+/, '');
      return { rule, nsn, e164: `${rule.code}${nsn}` };
    }
  }

  if (cleaned.startsWith('09') && cleaned.length === 10) {
    const syRule = COUNTRY_RULES.find((r) => r.code === '+963');
    const nsn = cleaned.slice(1);
    return { rule: syRule, nsn, e164: `+963${nsn}` };
  }
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    const iqRule = COUNTRY_RULES.find((r) => r.code === '+964');
    const nsn = cleaned.slice(1);
    return { rule: iqRule, nsn, e164: `+964${nsn}` };
  }
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    const joRule = COUNTRY_RULES.find((r) => r.code === '+962');
    const nsn = cleaned.slice(1);
    return { rule: joRule, nsn, e164: `+962${nsn}` };
  }
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    const saRule = COUNTRY_RULES.find((r) => r.code === '+966');
    const nsn = cleaned.slice(1);
    return { rule: saRule, nsn, e164: `+966${nsn}` };
  }
  if (cleaned.startsWith('05') && cleaned.length === 11) {
    const trRule = COUNTRY_RULES.find((r) => r.code === '+90');
    const nsn = cleaned.slice(1);
    return { rule: trRule, nsn, e164: `+90${nsn}` };
  }
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    const egRule = COUNTRY_RULES.find((r) => r.code === '+20');
    const nsn = cleaned.slice(1);
    return { rule: egRule, nsn, e164: `+20${nsn}` };
  }

  const sortedRules = [...COUNTRY_RULES].sort((a, b) => b.code.length - a.code.length);
  for (const r of sortedRules) {
    const bare = r.code.slice(1);
    if (cleaned.startsWith(bare) && r.lengths.includes(cleaned.length - bare.length)) {
      const nsn = cleaned.slice(bare.length);
      return { rule: r, nsn, e164: `${r.code}${nsn}` };
    }
  }

  return {
    rule: null,
    nsn: cleaned.replace(/^0+/, ''),
    e164: cleaned,
    unrecognizedLocal: true
  };
}

export function validatePhoneNumber(rawInput, selectedCountryCode = '+963') {
  const resolved = resolveRuleAndSubscriber(rawInput, selectedCountryCode);

  if (resolved.empty) {
    const defaultRule = COUNTRY_RULES.find((r) => r.code === selectedCountryCode);
    return {
      valid: false,
      state: 'empty',
      example: defaultRule?.example || '991234567',
      error: 'يرجى إدخال رقم الهاتف الجوال'
    };
  }

  if (resolved.invalidChars) {
    return { valid: false, state: 'invalid', error: resolved.error };
  }

  const { rule, nsn, e164 } = resolved;

  if (rule) {
    const minLen = Math.min(...rule.lengths);
    const maxLen = Math.max(...rule.lengths);

    if (nsn.length < minLen) {
      const remaining = minLen - nsn.length;
      return {
        valid: false,
        state: 'incomplete',
        countryAr: rule.countryAr,
        countryCode: rule.code,
        e164,
        error: `الرقم غير مكتمل لخطوط ${rule.countryAr} — متبقي ${remaining} ${
          remaining === 1 ? 'رقم' : 'أرقام'
        } (${rule.hintAr})`
      };
    }

    if (nsn.length > maxLen) {
      return {
        valid: false,
        state: 'invalid_length',
        countryAr: rule.countryAr,
        countryCode: rule.code,
        e164,
        error: `عدد خانات الرقم زائد عن المعيار الرسمي في ${rule.countryAr} (${rule.hintAr})`
      };
    }

    if (!rule.regex.test(nsn)) {
      return {
        valid: false,
        state: 'invalid_prefix',
        countryAr: rule.countryAr,
        countryCode: rule.code,
        e164,
        error: `مفتاح شركة الاتصالات غير صحيح في ${rule.countryAr} (${rule.hintAr})`
      };
    }

    const entropy = checkSubscriberEntropy(nsn);
    if (entropy.fake) {
      return {
        valid: false,
        state: 'fake_pattern',
        countryAr: rule.countryAr,
        countryCode: rule.code,
        e164,
        error: entropy.reason
      };
    }

    const carrier = rule.detectCarrier(nsn);
    return {
      valid: true,
      state: 'valid',
      countryAr: rule.countryAr,
      countryCode: rule.code,
      iso: rule.iso,
      carrier,
      nationalNumber: nsn,
      e164,
      summaryAr: `رقم صحيح ومعتمد • ${rule.countryAr} (${carrier})`
    };
  }

  if (resolved.genericInternational) {
    if (!/^[1-9]\d{8,14}$/.test(nsn)) {
      return {
        valid: false,
        state: 'invalid_intl',
        error: 'صيغة الرقم الدولي غير صحيحة — تأكد من مفتاح الدولة وعدد الخانات (9 إلى 15 رقماً)'
      };
    }
    const entropy = checkSubscriberEntropy(nsn.slice(2));
    if (entropy.fake) {
      return { valid: false, state: 'fake_pattern', error: entropy.reason };
    }
    return {
      valid: true,
      state: 'valid',
      countryAr: 'خط دولي معتمد',
      countryCode: '+' + nsn.slice(0, 2),
      carrier: 'شبكة اتصالات دولية (E.164)',
      nationalNumber: nsn,
      e164,
      summaryAr: 'رقم دولي صحيح ومطابق لمعيار الاتصالات العالمي (E.164)'
    };
  }

  return {
    valid: false,
    state: 'unrecognized',
    error: 'الرقم لا يطابق أي شبكة جوال معتمدة — اختر مفتاح الدولة الصحيح أو أدخل الصيغة الدولية (+...)'
  };
}
