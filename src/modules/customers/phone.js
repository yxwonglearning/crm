function normalizePhone(dialCode, rawPhone) {
  const codeDigits = String(dialCode).replace(/\D/g, '');
  let number = String(rawPhone || '').trim().replace(/[^\d+]/g, '');

  if (number.startsWith('+')) {
    const digits = number.replace(/\D/g, '');
    number = digits.startsWith(codeDigits) ? digits.slice(codeDigits.length) : digits;
  } else {
    number = number.replace(/\D/g, '');
  }

  number = number.replace(/^0+/, '');

  return {
    phoneCountryCode: dialCode,
    phoneNumber: number,
    internationalPhone: `${dialCode}${number}`
  };
}

module.exports = { normalizePhone };
