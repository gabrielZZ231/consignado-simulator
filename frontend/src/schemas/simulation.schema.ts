import { z } from 'zod';
import { parseCurrencyMaskedToNumber, stripNonDigits } from './formatters';

export const SIMULATION_LIMITS = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 120,
  SALARY_MIN: 500,
  SALARY_MAX: 1_000_000,
  REQUESTED_AMOUNT_MIN: 300,
  REQUESTED_AMOUNT_MAX: 500_000,
  INSTALLMENTS_MIN: 6,
  INSTALLMENTS_MAX: 84
} as const;

function isRepeatedSequence(digits: string): boolean {
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

  const firstDigit = calculateDigit(9, 10);
  if (firstDigit !== Number(digits[9])) return false;

  const secondDigit = calculateDigit(10, 11);
  return secondDigit === Number(digits[10]);
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

  if (calculateDigit(firstWeights) !== Number(digits[12])) return false;
  return calculateDigit(secondWeights) === Number(digits[13]);
}

export const simulationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      SIMULATION_LIMITS.NAME_MIN_LENGTH,
      `Informe o nome completo (mínimo de ${SIMULATION_LIMITS.NAME_MIN_LENGTH} caracteres).`
    )
    .max(
      SIMULATION_LIMITS.NAME_MAX_LENGTH,
      `Nome deve ter no máximo ${SIMULATION_LIMITS.NAME_MAX_LENGTH} caracteres.`
    ),
  email: z.string().trim().toLowerCase().email('Informe um endereço de e-mail válido.'),
  cpf: z
    .string()
    .refine((val) => stripNonDigits(val).length === 11, {
      message: 'CPF deve conter 11 dígitos.'
    })
    .refine((val) => isValidCpf(val), {
      message: 'CPF inválido. Verifique os dígitos verificadores.'
    }),
  cnpj: z
    .string()
    .refine((val) => stripNonDigits(val).length === 14, {
      message: 'CNPJ deve conter 14 dígitos.'
    })
    .refine((val) => isValidCnpj(val), {
      message: 'CNPJ inválido. Verifique os dígitos verificadores.'
    }),
  salaryMasked: z
    .string()
    .min(1, 'Informe o salário mensal.')
    .refine(
      (val) => {
        const numeric = parseCurrencyMaskedToNumber(val);
        return numeric >= SIMULATION_LIMITS.SALARY_MIN;
      },
      {
        message: `O salário deve ser de pelo menos R$ ${SIMULATION_LIMITS.SALARY_MIN.toLocaleString('pt-BR')},00.`
      }
    )
    .refine(
      (val) => {
        const numeric = parseCurrencyMaskedToNumber(val);
        return numeric <= SIMULATION_LIMITS.SALARY_MAX;
      },
      {
        message: `O salário máximo permitido para simulação é R$ ${SIMULATION_LIMITS.SALARY_MAX.toLocaleString('pt-BR')},00.`
      }
    ),
  requestedAmountMasked: z
    .string()
    .min(1, 'Informe o valor solicitado.')
    .refine(
      (val) => {
        const numeric = parseCurrencyMaskedToNumber(val);
        return numeric >= SIMULATION_LIMITS.REQUESTED_AMOUNT_MIN;
      },
      {
        message: `O valor solicitado deve ser de pelo menos R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MIN.toLocaleString('pt-BR')},00.`
      }
    )
    .refine(
      (val) => {
        const numeric = parseCurrencyMaskedToNumber(val);
        return numeric <= SIMULATION_LIMITS.REQUESTED_AMOUNT_MAX;
      },
      {
        message: `O valor solicitado máximo é R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MAX.toLocaleString('pt-BR')},00.`
      }
    ),
  installments: z.coerce
    .number({
      invalid_type_error: 'Informe um número inteiro de parcelas.'
    })
    .int('A quantidade de parcelas deve ser um número inteiro.')
    .min(
      SIMULATION_LIMITS.INSTALLMENTS_MIN,
      `Mínimo de ${SIMULATION_LIMITS.INSTALLMENTS_MIN} parcelas.`
    )
    .max(
      SIMULATION_LIMITS.INSTALLMENTS_MAX,
      `Máximo de ${SIMULATION_LIMITS.INSTALLMENTS_MAX} parcelas.`
    )
});

export type SimulationFormValues = z.infer<typeof simulationFormSchema>;
