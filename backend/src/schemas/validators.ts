export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isRepeatedSequence(digits: string): boolean {
  if (digits.length === 0) return true;
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(rawCpf: string): boolean {
  const digits = stripNonDigits(rawCpf);

  if (digits.length !== 11 || isRepeatedSequence(digits)) {
    return false;
  }

  const calculateDigit = (sliceLength: number, weightStart: number): number => {
    let sum = 0;
    for (let i = 0; i < sliceLength; i += 1) {
      sum += Number(digits[i]) * (weightStart - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstCheckDigit = calculateDigit(9, 10);
  if (firstCheckDigit !== Number(digits[9])) {
    return false;
  }

  const secondCheckDigit = calculateDigit(10, 11);
  return secondCheckDigit === Number(digits[10]);
}

export function isValidCnpj(rawCnpj: string): boolean {
  const digits = stripNonDigits(rawCnpj);

  if (digits.length !== 14 || isRepeatedSequence(digits)) {
    return false;
  }

  const calculateDigit = (weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i += 1) {
      sum += Number(digits[i]) * (weights[i] ?? 0);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstCheckDigit = calculateDigit(firstWeights);
  if (firstCheckDigit !== Number(digits[12])) {
    return false;
  }

  const secondCheckDigit = calculateDigit(secondWeights);
  return secondCheckDigit === Number(digits[13]);
}

export function maskCpf(rawCpf: string): string {
  const digits = stripNonDigits(rawCpf);
  if (digits.length !== 11) {
    return '***.***.***-**';
  }
  return `***.${digits.slice(3, 6)}.***-${digits.slice(9, 11)}`;
}
