import { describe, expect, it } from 'vitest';
import { IntegrationTimeoutError, IntegrationUnavailableError } from '../src/errors/app-error.js';
import {
  BancoAlfaIntegration,
  normalizeBancoAlfaResponse
} from '../src/integrations/banco-alfa.integration.js';
import {
  BancoBetaIntegration,
  normalizeBancoBetaResponse
} from '../src/integrations/banco-beta.integration.js';
import type { SimulationRequest } from '../src/types/simulation.types.js';

const BASE_REQUEST: SimulationRequest = {
  name: 'João da Silva',
  email: 'joao.silva@exemplo.com',
  cpf: '52998224725',
  cnpj: '11222333000181',
  salary: 6000,
  requestedAmount: 10_000,
  installments: 24
};

describe('Integrações e normalização de formatos bancários', () => {
  describe('Normalização de formatos particulares', () => {
    it('normaliza o formato snake_case em reais do Banco Alfa para o contrato comum', () => {
      const normalized = normalizeBancoAlfaResponse(
        {
          codigo_instituicao: 'ALFA',
          nome_instituicao: 'Banco Alfa',
          situacao_proposta: 'APROVADA',
          taxa_juros_mensal: 0.0175,
          condicoes_aprovadas: {
            valor_financiado: 10_000,
            prazo_meses: 24,
            valor_parcela_fixa: 513.86,
            valor_total_estimado: 12_332.64
          }
        },
        42
      );

      expect(normalized).toEqual({
        bankCode: 'banco-alfa',
        bankName: 'Banco Alfa',
        status: 'approved',
        monthlyInterestRate: 0.0175,
        installmentAmount: 513.86,
        approvedAmount: 10_000,
        installments: 24,
        totalAmount: 12_332.64,
        message:
          'Proposta aprovada nas regras fictícias do Banco Alfa (valores meramente estimativos).',
        reasonCode: 'APPROVED',
        responseTimeMs: 42
      });
    });

    it('normaliza o formato aninhado em centavos do Banco Beta para o contrato comum em reais', () => {
      const normalized = normalizeBancoBetaResponse(
        {
          institution: { id: 'BETA', displayName: 'Banco Beta' },
          decision: {
            outcome: 'ELIGIBLE',
            reasonCode: 'APPROVED',
            explanation: 'Proposta aprovada.'
          },
          proposal: {
            monthlyRate: 0.0198,
            principalCents: 1_000_000,
            installmentCents: 52_760,
            totalCents: 1_266_240,
            termMonths: 24
          }
        },
        55
      );

      expect(normalized).toEqual({
        bankCode: 'banco-beta',
        bankName: 'Banco Beta',
        status: 'approved',
        monthlyInterestRate: 0.0198,
        installmentAmount: 527.6,
        approvedAmount: 10_000,
        installments: 24,
        totalAmount: 12_662.4,
        message: 'Proposta aprovada.',
        reasonCode: 'APPROVED',
        responseTimeMs: 55
      });
    });
  });

  describe('Regras fictícias do Banco Alfa', () => {
    const alfa = new BancoAlfaIntegration({ latencyMs: 1 });

    it('aprova quando valor <= 50k, prazo <= 48x e parcela <= 30% do salário', async () => {
      const result = await alfa.simulate(BASE_REQUEST);
      expect(result.status).toBe('approved');
      expect(result.monthlyInterestRate).toBe(0.0175);
      expect(result.installmentAmount).toBe(513.86);
    });

    it('reprova quando o valor solicitado ultrapassa R$ 50.000,00', async () => {
      const result = await alfa.simulate({ ...BASE_REQUEST, requestedAmount: 60_000 });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('AMOUNT_EXCEEDS_MAX');
      expect(result.installmentAmount).toBeNull();
    });

    it('reprova quando o prazo ultrapassa 48 parcelas', async () => {
      const result = await alfa.simulate({ ...BASE_REQUEST, installments: 60 });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('TERM_OUT_OF_RANGE');
    });

    it('reprova quando a parcela excede 30% do salário informado', async () => {
      const result = await alfa.simulate({
        ...BASE_REQUEST,
        salary: 1200,
        requestedAmount: 20_000,
        installments: 24
      });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('MARGIN_EXCEEDED');
    });
  });

  describe('Regras fictícias do Banco Beta', () => {
    const beta = new BancoBetaIntegration({ latencyMs: 1 });

    it('aprova quando valor está entre 1k e 120k, prazo entre 12x e 84x e parcela <= 35% do salário', async () => {
      const result = await beta.simulate({
        ...BASE_REQUEST,
        requestedAmount: 60_000,
        installments: 60,
        salary: 6000
      });
      expect(result.status).toBe('approved');
      expect(result.monthlyInterestRate).toBe(0.0198);
      expect(result.installmentAmount).toBeGreaterThan(0);
    });

    it('reprova quando o valor solicitado é inferior a R$ 1.000,00', async () => {
      const result = await beta.simulate({ ...BASE_REQUEST, requestedAmount: 800 });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('AMOUNT_BELOW_MIN');
    });

    it('reprova quando o prazo é inferior a 12 parcelas', async () => {
      const result = await beta.simulate({ ...BASE_REQUEST, installments: 6 });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('TERM_OUT_OF_RANGE');
    });

    it('reprova quando a parcela excede 35% do salário informado', async () => {
      const result = await beta.simulate({
        ...BASE_REQUEST,
        salary: 1200,
        requestedAmount: 25_000,
        installments: 24
      });
      expect(result.status).toBe('rejected');
      expect(result.reasonCode).toBe('MARGIN_EXCEEDED');
    });
  });

  describe('Modos controlados de falha e timeout por integração', () => {
    it('lança IntegrationUnavailableError quando configurado em modo de erro', async () => {
      const failingAlfa = new BancoAlfaIntegration({ latencyMs: 1, failureMode: 'error' });
      await expect(failingAlfa.simulate(BASE_REQUEST)).rejects.toThrow(
        IntegrationUnavailableError
      );
    });

    it('lança IntegrationTimeoutError quando a execução excede o timeout individual', async () => {
      const slowBeta = new BancoBetaIntegration({
        timeoutMs: 25,
        failureMode: 'timeout'
      });
      await expect(slowBeta.simulate(BASE_REQUEST)).rejects.toThrow(IntegrationTimeoutError);
    });
  });
});
