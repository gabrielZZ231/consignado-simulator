import { describe, expect, it } from 'vitest';
import { calculatePriceInstallment } from '../src/services/price-calculator.service.js';

describe('Cálculo financeiro pela Tabela Price', () => {
  it('calcula corretamente a parcela fixa para juros compostos (taxa > 0)', () => {
    const result = calculatePriceInstallment({
      principal: 10_000,
      monthlyInterestRate: 0.0175,
      installments: 24
    });

    expect(result.installmentAmount).toBe(513.86);
    expect(result.totalAmount).toBe(12_332.64);
  });

  it('usa principal / n quando a taxa mensal é zero', () => {
    const result = calculatePriceInstallment({
      principal: 12_000,
      monthlyInterestRate: 0,
      installments: 12
    });

    expect(result.installmentAmount).toBe(1000);
    expect(result.totalAmount).toBe(12_000);
  });

  it('funciona nos limites mínimo e máximo de parcelas do sistema (6 e 84)', () => {
    const shortTerm = calculatePriceInstallment({
      principal: 3000,
      monthlyInterestRate: 0.0175,
      installments: 6
    });
    const longTerm = calculatePriceInstallment({
      principal: 50_000,
      monthlyInterestRate: 0.0198,
      installments: 84
    });

    expect(shortTerm.installmentAmount).toBeGreaterThan(500);
    expect(longTerm.installmentAmount).toBeGreaterThan(1000);
    expect(longTerm.totalAmount).toBeGreaterThan(50_000);
  });

  it('lança RangeError para entradas inválidas (principal <= 0, parcelas <= 0 ou taxa < 0)', () => {
    expect(() =>
      calculatePriceInstallment({ principal: 0, monthlyInterestRate: 0.02, installments: 12 })
    ).toThrow(RangeError);

    expect(() =>
      calculatePriceInstallment({ principal: 1000, monthlyInterestRate: -0.01, installments: 12 })
    ).toThrow(RangeError);

    expect(() =>
      calculatePriceInstallment({ principal: 1000, monthlyInterestRate: 0.01, installments: 0 })
    ).toThrow(RangeError);
  });
});
