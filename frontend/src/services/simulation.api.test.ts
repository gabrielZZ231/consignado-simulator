import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SimulationRequestPayload } from '../types/simulation.types';
import { SimulationApiError, streamSimulation } from './simulation.api';

afterEach(() => {
  vi.restoreAllMocks();
});

const SAMPLE_PAYLOAD: SimulationRequestPayload = {
  name: 'Maria Oliveira',
  email: 'maria.oliveira@exemplo.com.br',
  cpf: '52998224725',
  cnpj: '11222333000181',
  salary: 5500,
  requestedAmount: 10000,
  installments: 24
};

function createChunkStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
}

describe('streamSimulation — Parser SSE com ReadableStream', () => {
  it('reconstrói corretamente um evento dividido em múltiplos chunks e vários eventos no mesmo chunk', async () => {
    const metaJson = JSON.stringify({
      simulationId: 'sim-1',
      createdAt: '2026-10-23T12:00:00.000Z',
      disclaimer: 'Fictício',
      inputSummary: { requestedAmount: 10000, installments: 24 },
      banks: [
        { bankCode: 'banco-alfa', bankName: 'Banco Alfa' },
        { bankCode: 'banco-beta', bankName: 'Banco Beta' }
      ]
    });

    const alfaJson = JSON.stringify({
      simulationId: 'sim-1',
      result: {
        bankCode: 'banco-alfa',
        bankName: 'Banco Alfa',
        status: 'approved',
        monthlyInterestRate: 0.0175,
        installmentAmount: 513.86,
        approvedAmount: 10000,
        installments: 24,
        totalAmount: 12332.64,
        message: 'Aprovado Alfa',
        reasonCode: 'APPROVED',
        responseTimeMs: 45
      }
    });

    const completeJson = JSON.stringify({
      simulationId: 'sim-1',
      completedAt: '2026-10-23T12:00:01.000Z',
      resultsCount: 1
    });

    const chunks = [
      ': keep-alive\n\nevent: me',
      `ta\ndata: ${metaJson.slice(0, 40)}`,
      `${metaJson.slice(40)}\n\n`,
      `event: bank-result\ndata: ${alfaJson}\n\nevent: complete\ndata: ${completeJson}\n\n`
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: createChunkStream(chunks)
    } as Response);

    const receivedEvents: string[] = [];

    await streamSimulation(SAMPLE_PAYLOAD, {
      onMeta: (meta) => {
        receivedEvents.push(`meta:${meta.simulationId}:${meta.banks.length}`);
      },
      onBankResult: ({ result }) => {
        receivedEvents.push(`bank:${result.bankCode}:${result.status}`);
      },
      onComplete: (done) => {
        receivedEvents.push(`complete:${done.resultsCount}`);
      }
    });

    expect(receivedEvents).toEqual([
      'meta:sim-1:2',
      'bank:banco-alfa:approved',
      'complete:1'
    ]);
  });

  it('suporta delimitadores CRLF (\\r\\n\\r\\n)', async () => {
    const metaJson = JSON.stringify({
      simulationId: 'sim-crlf',
      createdAt: '2026-10-23T12:00:00.000Z',
      disclaimer: 'Fictício',
      inputSummary: { requestedAmount: 10000, installments: 24 },
      banks: [{ bankCode: 'banco-alfa', bankName: 'Banco Alfa' }]
    });

    const completeJson = JSON.stringify({
      simulationId: 'sim-crlf',
      completedAt: '2026-10-23T12:00:01.000Z',
      resultsCount: 0
    });

    const rawStream = `event: meta\r\ndata: ${metaJson}\r\n\r\nevent: complete\r\ndata: ${completeJson}\r\n\r\n`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: createChunkStream([rawStream])
    } as Response);

    const events: string[] = [];
    await streamSimulation(SAMPLE_PAYLOAD, {
      onMeta: (m) => {
        events.push(`meta:${m.simulationId}`);
      },
      onComplete: (c) => {
        events.push(`complete:${c.simulationId}`);
      }
    });

    expect(events).toEqual(['meta:sim-crlf', 'complete:sim-crlf']);
  });

  it('encerra com SimulationApiError controlado quando recebe JSON inválido no stream', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: createChunkStream(['event: meta\ndata: {json-quebrado\n\n'])
    } as Response);

    await expect(streamSimulation(SAMPLE_PAYLOAD, {})).rejects.toThrow(SimulationApiError);
  });

  it('propaga AbortError quando o AbortController cancela a requisição', async () => {
    const controller = new AbortController();

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const promise = streamSimulation(SAMPLE_PAYLOAD, {}, controller.signal);
    controller.abort();

    await expect(promise).rejects.toThrow(/aborted/i);
  });
});
