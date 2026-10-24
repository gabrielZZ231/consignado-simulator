import { z } from 'zod';
import { isValidCnpj, isValidCpf, stripNonDigits } from './validators.js';

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

export const simulationRequestSchema = z.object({
  name: z
    .string({
      required_error: 'Nome é obrigatório.',
      invalid_type_error: 'Nome deve ser um texto.'
    })
    .trim()
    .min(
      SIMULATION_LIMITS.NAME_MIN_LENGTH,
      `Nome deve ter pelo menos ${SIMULATION_LIMITS.NAME_MIN_LENGTH} caracteres.`
    )
    .max(
      SIMULATION_LIMITS.NAME_MAX_LENGTH,
      `Nome deve ter no máximo ${SIMULATION_LIMITS.NAME_MAX_LENGTH} caracteres.`
    ),
  email: z
    .string({
      required_error: 'E-mail é obrigatório.',
      invalid_type_error: 'E-mail deve ser um texto.'
    })
    .trim()
    .toLowerCase()
    .email('Informe um endereço de e-mail válido.'),
  cpf: z
    .string({
      required_error: 'CPF é obrigatório.',
      invalid_type_error: 'CPF deve ser um texto.'
    })
    .transform((val) => stripNonDigits(val))
    .refine((digits) => digits.length === 11, {
      message: 'CPF deve conter 11 dígitos numéricos.'
    })
    .refine((digits) => isValidCpf(digits), {
      message: 'CPF inválido. Verifique os dígitos informados.'
    }),
  cnpj: z
    .string({
      required_error: 'CNPJ da empresa conveniada é obrigatório.',
      invalid_type_error: 'CNPJ deve ser um texto.'
    })
    .transform((val) => stripNonDigits(val))
    .refine((digits) => digits.length === 14, {
      message: 'CNPJ deve conter 14 dígitos numéricos.'
    })
    .refine((digits) => isValidCnpj(digits), {
      message: 'CNPJ inválido. Verifique os dígitos informados.'
    }),
  salary: z
    .number({
      required_error: 'Salário é obrigatório.',
      invalid_type_error: 'Salário deve ser um número válido.'
    })
    .finite('Salário deve ser um número finito.')
    .min(
      SIMULATION_LIMITS.SALARY_MIN,
      `Salário deve ser de no mínimo R$ ${SIMULATION_LIMITS.SALARY_MIN},00.`
    )
    .max(
      SIMULATION_LIMITS.SALARY_MAX,
      `Salário deve ser de no máximo R$ ${SIMULATION_LIMITS.SALARY_MAX.toLocaleString('pt-BR')},00.`
    ),
  requestedAmount: z
    .number({
      required_error: 'Valor solicitado é obrigatório.',
      invalid_type_error: 'Valor solicitado deve ser um número válido.'
    })
    .finite('Valor solicitado deve ser um número finito.')
    .min(
      SIMULATION_LIMITS.REQUESTED_AMOUNT_MIN,
      `Valor solicitado deve ser de no mínimo R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MIN},00.`
    )
    .max(
      SIMULATION_LIMITS.REQUESTED_AMOUNT_MAX,
      `Valor solicitado deve ser de no máximo R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MAX.toLocaleString('pt-BR')},00.`
    ),
  installments: z
    .number({
      required_error: 'Quantidade de parcelas é obrigatória.',
      invalid_type_error: 'Quantidade de parcelas deve ser um número inteiro.'
    })
    .int('Quantidade de parcelas deve ser um número inteiro.')
    .min(
      SIMULATION_LIMITS.INSTALLMENTS_MIN,
      `Quantidade de parcelas deve ser de no mínimo ${SIMULATION_LIMITS.INSTALLMENTS_MIN}.`
    )
    .max(
      SIMULATION_LIMITS.INSTALLMENTS_MAX,
      `Quantidade de parcelas deve ser de no máximo ${SIMULATION_LIMITS.INSTALLMENTS_MAX}.`
    )
});

export type ValidatedSimulationRequest = z.infer<typeof simulationRequestSchema>;
