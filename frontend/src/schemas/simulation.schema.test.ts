import { describe, expect, it } from 'vitest';
import {
  formatCnpjMask,
  formatCpfMask,
  formatCurrencyInputMask,
  parseCurrencyMaskedToNumber
} from './formatters';
import { simulationFormSchema } from './simulation.schema';

describe('Máscaras e validação do formulário frontend', () => {
  it('aplica máscaras visuais de CPF, CNPJ e moeda e converte para valor numérico limpo', () => {
    expect(formatCpfMask('52998224725')).toBe('529.982.247-25');
    expect(formatCnpjMask('11222333000181')).toBe('11.222.333/0001-81');

    const maskedCurrency = formatCurrencyInputMask('550000');
    expect(maskedCurrency).toBe('5.500,00');
    expect(parseCurrencyMaskedToNumber(maskedCurrency)).toBe(5500);
  });

  it('valida dados corretos no schema Zod do formulário', () => {
    const parsed = simulationFormSchema.safeParse({
      name: 'Maria Clara Oliveira',
      email: 'maria@exemplo.com.br',
      cpf: '529.982.247-25',
      cnpj: '11.222.333/0001-81',
      salaryMasked: '5.500,00',
      requestedAmountMasked: '10.000,00',
      installments: 24
    });

    expect(parsed.success).toBe(true);
  });

  it('rejeita CPF/CNPJ com dígitos repetidos e valores fora dos limites', () => {
    const invalid = simulationFormSchema.safeParse({
      name: 'AB',
      email: 'invalido',
      cpf: '111.111.111-11',
      cnpj: '00.000.000/0000-00',
      salaryMasked: '100,00',
      requestedAmountMasked: '50,00',
      installments: 3
    });

    expect(invalid.success).toBe(false);
  });
});
