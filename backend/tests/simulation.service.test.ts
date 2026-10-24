import { describe, expect, it } from 'vitest';
import { BancoAlfaIntegration } from '../src/integrations/banco-alfa.integration.js';
import { BancoBetaIntegration } from '../src/integrations/banco-beta.integration.js';
import { SimulationService, type SimulationLogger } from '../src/services/simulation.service.js';
import type { SimulationRequest } from '../src/types/simulation.types.js';

const SAMPLE_REQUEST: SimulationRequest = {
  name: 'Ana Beatriz Souza',
  email: 'ana.souza@exemplo.com',
  cpf: '52998224725',
  cnpj: '11222333000181',
  salary: 5500,
  requestedAmount: 12_000,
  installments: 24
};

describe('SimulationService — Isolamento de falhas, startSimulation e privacidade de logs', () => {
  it('retorna unavailable para o banco que falha sem descartar o sucesso do outro banco', async () => {
    const service = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 1, failureMode: 'error' }),
      new BancoBetaIntegration({ latencyMs: 1, failureMode: 'none' })
    ]);

    const response = await service.runSimulation(SAMPLE_REQUEST);

    expect(response.results).toHaveLength(2);
    const alfa = response.results.find((r) => r.bankCode === 'banco-alfa');
    const beta = response.results.find((r) => r.bankCode === 'banco-beta');

    expect(alfa?.status).toBe('unavailable');
    expect(alfa?.reasonCode).toBe('INTEGRATION_ERROR');
    expect(alfa?.installmentAmount).toBeNull();

    expect(beta?.status).toBe('approved');
    expect(beta?.reasonCode).toBe('APPROVED');
    expect(beta?.installmentAmount).toBeGreaterThan(0);
  });

  it('retorna unavailable com reasonCode TIMEOUT quando um banco excede o tempo limite e o outro aprova', async () => {
    const service = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 1, failureMode: 'none' }),
      new BancoBetaIntegration({ timeoutMs: 20, failureMode: 'timeout' })
    ]);

    const response = await service.runSimulation(SAMPLE_REQUEST);

    const alfa = response.results.find((r) => r.bankCode === 'banco-alfa');
    const beta = response.results.find((r) => r.bankCode === 'banco-beta');

    expect(alfa?.status).toBe('approved');
    expect(beta?.status).toBe('unavailable');
    expect(beta?.reasonCode).toBe('TIMEOUT');
    expect(beta?.message).toContain('Tempo limite excedido');
  });

  it('runSimulation preserva a ordem configurada dos bancos mesmo quando o segundo termina antes', async () => {
    const service = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 35, failureMode: 'none' }),
      new BancoBetaIntegration({ latencyMs: 2, failureMode: 'none' })
    ]);

    const response = await service.runSimulation(SAMPLE_REQUEST);

    expect(response.results.map((r) => r.bankCode)).toEqual(['banco-alfa', 'banco-beta']);
  });

  it('startSimulation gera metadados e uma promessa por banco normalizando falhas isoladamente', async () => {
    const service = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 5, failureMode: 'error' }),
      new BancoBetaIntegration({ timeoutMs: 15, failureMode: 'timeout' })
    ]);

    const { metadata, bankPromises } = service.startSimulation(SAMPLE_REQUEST);

    expect(metadata.simulationId).toBeTypeOf('string');
    expect(metadata.banks).toEqual([
      { bankCode: 'banco-alfa', bankName: 'Banco Alfa' },
      { bankCode: 'banco-beta', bankName: 'Banco Beta' }
    ]);
    expect(bankPromises).toHaveLength(2);

    const completions = await Promise.all(bankPromises);
    expect(completions[0]?.result.status).toBe('unavailable');
    expect(completions[0]?.result.reasonCode).toBe('INTEGRATION_ERROR');
    expect(completions[1]?.result.status).toBe('unavailable');
    expect(completions[1]?.result.reasonCode).toBe('TIMEOUT');
  });

  it('nunca registra o CPF completo nos logs de execução ou de alerta', async () => {
    const recordedLogs: string[] = [];
    const mockLogger: SimulationLogger = {
      info: (bindings, msg) => {
        recordedLogs.push(JSON.stringify({ bindings, msg }));
      },
      warn: (bindings, msg) => {
        recordedLogs.push(JSON.stringify({ bindings, msg }));
      }
    };

    const service = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 1, failureMode: 'error' }),
      new BancoBetaIntegration({ latencyMs: 1, failureMode: 'none' })
    ]);

    await service.runSimulation(SAMPLE_REQUEST, mockLogger);

    expect(recordedLogs.length).toBeGreaterThan(0);
    for (const entry of recordedLogs) {
      expect(entry).not.toContain(SAMPLE_REQUEST.cpf);
      expect(entry).toContain('***.982.***-25');
    }
  });
});
