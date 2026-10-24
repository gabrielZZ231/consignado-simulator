import { describe, expect, it } from 'vitest';
import { simulationRequestSchema } from '../src/schemas/simulation.schema.js';
import { isValidCnpj, isValidCpf, maskCpf } from '../src/schemas/validators.js';

const VALID_PAYLOAD = {
  name: 'Maria Clara Oliveira',
  email: 'maria.oliveira@exemplo.com.br',
  cpf: '52998224725',
  cnpj: '11222333000181',
  salary: 5000,
  requestedAmount: 10000,
  installments: 24
};

describe('Validação de documentos e schema de simulação', () => {
  describe('Validador de CPF', () => {
    it('aceita CPF válido com e sem máscara', () => {
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('rejeita sequências repetidas e dígitos verificadores incorretos', () => {
      expect(isValidCpf('00000000000')).toBe(false);
      expect(isValidCpf('111.111.111-11')).toBe(false);
      expect(isValidCpf('99999999999')).toBe(false);
      expect(isValidCpf('52998224720')).toBe(false);
      expect(isValidCpf('12345')).toBe(false);
    });

    it('mascara o CPF para evitar exposição completa em logs', () => {
      const masked = maskCpf('52998224725');
      expect(masked).toBe('***.982.***-25');
      expect(masked).not.toContain('52998224725');
    });
  });

  describe('Validador de CNPJ', () => {
    it('aceita CNPJ válido com e sem máscara', () => {
      expect(isValidCnpj('11222333000181')).toBe(true);
      expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    });

    it('rejeita sequências repetidas e dígitos verificadores incorretos', () => {
      expect(isValidCnpj('00000000000000')).toBe(false);
      expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
      expect(isValidCnpj('11222333000189')).toBe(false);
      expect(isValidCnpj('12345678')).toBe(false);
    });
  });

  describe('simulationRequestSchema', () => {
    it('valida e normaliza um payload válido (remove máscara de CPF/CNPJ e normaliza e-mail)', () => {
      const parsed = simulationRequestSchema.parse({
        ...VALID_PAYLOAD,
        email: '  MARIA.OLIVEIRA@EXEMPLO.COM.BR ',
        cpf: '529.982.247-25',
        cnpj: '11.222.333/0001-81'
      });

      expect(parsed.email).toBe('maria.oliveira@exemplo.com.br');
      expect(parsed.cpf).toBe('52998224725');
      expect(parsed.cnpj).toBe('11222333000181');
    });

    it('rejeita e-mail em formato inválido', () => {
      const result = simulationRequestSchema.safeParse({
        ...VALID_PAYLOAD,
        email: 'email-invalido'
      });
      expect(result.success).toBe(false);
    });

    it('rejeita CPF inválido ou com dígitos repetidos', () => {
      const result = simulationRequestSchema.safeParse({
        ...VALID_PAYLOAD,
        cpf: '111.111.111-11'
      });
      expect(result.success).toBe(false);
    });

    it('rejeita CNPJ inválido ou com dígitos repetidos', () => {
      const result = simulationRequestSchema.safeParse({
        ...VALID_PAYLOAD,
        cnpj: '22.222.222/2222-22'
      });
      expect(result.success).toBe(false);
    });

    it('rejeita salário abaixo do mínimo ou negativo', () => {
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, salary: 0 }).success
      ).toBe(false);
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, salary: -1500 }).success
      ).toBe(false);
    });

    it('rejeita valor solicitado fora dos limites permitidos', () => {
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, requestedAmount: 50 }).success
      ).toBe(false);
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, requestedAmount: 900_000 }).success
      ).toBe(false);
    });

    it('rejeita quantidade de parcelas não inteira ou fora da faixa [6, 84]', () => {
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, installments: 3 }).success
      ).toBe(false);
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, installments: 96 }).success
      ).toBe(false);
      expect(
        simulationRequestSchema.safeParse({ ...VALID_PAYLOAD, installments: 12.5 }).success
      ).toBe(false);
    });
  });
});
