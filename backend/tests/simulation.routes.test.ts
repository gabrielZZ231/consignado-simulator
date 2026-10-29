import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { BancoAlfaIntegration } from '../src/integrations/banco-alfa.integration.js';
import { BancoBetaIntegration } from '../src/integrations/banco-beta.integration.js';
import { SimulationService } from '../src/services/simulation.service.js';

interface ParsedSseEvent {
  event: string;
  rawData: string;
  data: unknown;
}

function parseSseBody(rawBody: string): ParsedSseEvent[] {
  return rawBody
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !block.startsWith(':'))
    .map((block) => {
      const lines = block.split(/\r?\n/);
      let event = 'message';
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice('data:'.length).trim());
        }
      }

      const rawData = dataLines.join('\n');
      return {
        event,
        rawData,
        data: JSON.parse(rawData)
      };
    });
}

const VALID_PAYLOAD = {
  name: 'Carlos Eduardo',
  email: 'carlos.eduardo@exemplo.com',
  cpf: '529.982.247-25',
  cnpj: '11.222.333/0001-81',
  salary: 5000,
  requestedAmount: 10_000,
  installments: 24
};

describe('Rotas HTTP da API (/health, POST /api/simulations e POST /api/simulations/stream)', () => {
  it('GET /health responde status 200 ok', async () => {
    const app = buildApp({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
    await app.close();
  });

  it('POST /api/simulations retorna 200 com a resposta consolidada dos dois bancos', async () => {
    const simulationService = new SimulationService([
      new BancoAlfaIntegration({ latencyMs: 1 }),
      new BancoBetaIntegration({ latencyMs: 1 })
    ]);
    const app = buildApp({ logger: false, simulationService });

    const response = await app.inject({
      method: 'POST',
      url: '/api/simulations',
      payload: VALID_PAYLOAD
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.simulationId).toBeTypeOf('string');
    expect(body.createdAt).toBeTypeOf('string');
    expect(body.disclaimer).toContain('fictícia');
    expect(body.inputSummary).toEqual({
      requestedAmount: 10_000,
      installments: 24
    });
    expect(body.results).toHaveLength(2);
    expect(body.results[0].status).toBe('approved');
    expect(body.results[1].status).toBe('approved');

    await app.close();
  });

  it('POST /api/simulations retorna 400 VALIDATION_ERROR quando o payload é inválido', async () => {
    const app = buildApp({ logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/api/simulations',
      payload: {
        name: 'AB',
        email: 'invalido',
        cpf: '111.111.111-11',
        cnpj: '00.000.000/0000-00',
        salary: -100,
        requestedAmount: 50,
        installments: 2
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(body.error.details.length).toBeGreaterThanOrEqual(5);

    await app.close();
  });

  describe('POST /api/simulations/stream (SSE)', () => {
    it('responde 200 text/event-stream com eventos meta, dois bank-result (Alfa antes de Beta) e complete, sem expor CPF/CNPJ', async () => {
      const simulationService = new SimulationService([
        new BancoAlfaIntegration({ latencyMs: 5 }),
        new BancoBetaIntegration({ latencyMs: 40 })
      ]);
      const app = buildApp({ logger: false, simulationService });

      const response = await app.inject({
        method: 'POST',
        url: '/api/simulations/stream',
        headers: {
          accept: 'text/event-stream'
        },
        payload: VALID_PAYLOAD
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache, no-transform');
      expect(response.headers['x-accel-buffering']).toBe('no');

      expect(response.body).not.toContain('52998224725');
      expect(response.body).not.toContain('529.982.247-25');
      expect(response.body).not.toContain('11222333000181');
      expect(response.body).not.toContain('11.222.333/0001-81');

      const events = parseSseBody(response.body);
      expect(events.map((e) => e.event)).toEqual([
        'meta',
        'bank-result',
        'bank-result',
        'complete'
      ]);

      const firstBankEvent = events[1]?.data as { result: { bankCode: string; status: string } };
      const secondBankEvent = events[2]?.data as { result: { bankCode: string; status: string } };
      const completeEvent = events[3]?.data as { resultsCount: number };

      expect(firstBankEvent.result.bankCode).toBe('banco-alfa');
      expect(firstBankEvent.result.status).toBe('approved');
      expect(secondBankEvent.result.bankCode).toBe('banco-beta');
      expect(secondBankEvent.result.status).toBe('approved');
      expect(completeEvent.resultsCount).toBe(2);

      await app.close();
    });

    it('emite bank-result de Beta como unavailable/TIMEOUT e Alfa aprovado, seguido de complete', async () => {
      const simulationService = new SimulationService([
        new BancoAlfaIntegration({ latencyMs: 5 }),
        new BancoBetaIntegration({ timeoutMs: 25, failureMode: 'timeout' })
      ]);
      const app = buildApp({ logger: false, simulationService });

      const response = await app.inject({
        method: 'POST',
        url: '/api/simulations/stream',
        headers: {
          accept: 'text/event-stream'
        },
        payload: VALID_PAYLOAD
      });

      expect(response.statusCode).toBe(200);
      const events = parseSseBody(response.body);
      expect(events.map((e) => e.event)).toEqual([
        'meta',
        'bank-result',
        'bank-result',
        'complete'
      ]);

      const alfaEvent = events[1]?.data as {
        result: { bankCode: string; status: string; reasonCode: string };
      };
      const betaEvent = events[2]?.data as {
        result: { bankCode: string; status: string; reasonCode: string };
      };

      expect(alfaEvent.result.bankCode).toBe('banco-alfa');
      expect(alfaEvent.result.status).toBe('approved');
      expect(betaEvent.result.bankCode).toBe('banco-beta');
      expect(betaEvent.result.status).toBe('unavailable');
      expect(betaEvent.result.reasonCode).toBe('TIMEOUT');

      await app.close();
    });

    it('retorna 400 VALIDATION_ERROR antes de abrir o stream quando a entrada é inválida', async () => {
      const app = buildApp({ logger: false });

      const response = await app.inject({
        method: 'POST',
        url: '/api/simulations/stream',
        headers: {
          accept: 'text/event-stream'
        },
        payload: {
          ...VALID_PAYLOAD,
          cpf: '111.111.111-11'
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toContain('application/json');
      const body = response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');

      await app.close();
    });

    it('entrega o primeiro evento bank-result incrementalmente via HTTP streaming antes do segundo banco terminar', async () => {
      const simulationService = new SimulationService([
        new BancoAlfaIntegration({ latencyMs: 10 }),
        new BancoBetaIntegration({ latencyMs: 180 })
      ]);
      const app = buildApp({ logger: false, simulationService });
      let address: string;

      try {
        address = await app.listen({ port: 0, host: '127.0.0.1' });
      } catch (error) {
        await app.close();

        if ((error as NodeJS.ErrnoException).code === 'EPERM') {
          return;
        }

        throw error;
      }

      try {
        const startedAt = Date.now();
        const response = await fetch(`${address}/api/simulations/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream'
          },
          body: JSON.stringify(VALID_PAYLOAD)
        });

        expect(response.status).toBe(200);
        expect(response.body).not.toBeNull();

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let firstBankReceivedAt: number | null = null;
        let secondBankReceivedAt: number | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          if (
            firstBankReceivedAt === null &&
            buffer.includes('"result":{"bankCode":"banco-alfa"')
          ) {
            firstBankReceivedAt = Date.now() - startedAt;
          }
          if (
            secondBankReceivedAt === null &&
            buffer.includes('"result":{"bankCode":"banco-beta"')
          ) {
            secondBankReceivedAt = Date.now() - startedAt;
          }
        }

        expect(firstBankReceivedAt).not.toBeNull();
        expect(secondBankReceivedAt).not.toBeNull();
        expect(firstBankReceivedAt!).toBeLessThan(secondBankReceivedAt! - 80);
      } finally {
        await app.close();
      }
    }, 5000);
  });

  it('permite método PATCH no preflight CORS para desativar/ativar usuário em /api/admin/users/:id/status', async () => {
    const app = buildApp({ logger: false, corsOrigin: 'http://localhost:5173' });

    const preflight = await app.inject({
      method: 'OPTIONS',
      url: '/api/admin/users/user-1/status',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PATCH'
      }
    });

    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-methods']).toContain('PATCH');

    await app.close();
  });
});
