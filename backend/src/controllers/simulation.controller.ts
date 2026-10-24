import type { ServerResponse } from 'node:http';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { simulationRequestSchema } from '../schemas/simulation.schema.js';
import type {
  BankSimulationCompletion,
  SimulationService
} from '../services/simulation.service.js';
import type { SimulationStreamEvent } from '../types/simulation.types.js';

export const SSE_KEEP_ALIVE_INTERVAL_MS = 15_000;

export function writeSse<E extends SimulationStreamEvent['event']>(
  response: Pick<ServerResponse, 'write' | 'writableEnded' | 'destroyed'>,
  event: E,
  payload: Extract<SimulationStreamEvent, { event: E }>['data']
): void {
  if (response.destroyed || response.writableEnded) {
    return;
  }
  const json = JSON.stringify(payload);
  response.write(`event: ${event}\ndata: ${json}\n\n`);
}

interface WrappedBankCompletion {
  wrapper: Promise<WrappedBankCompletion>;
  completion: BankSimulationCompletion;
}

export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  public handleCreateSimulation = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> => {
    const validatedInput = simulationRequestSchema.parse(request.body);
    const response = await this.simulationService.runSimulation(validatedInput, request.log);
    return reply.status(200).send(response);
  };

  public handleCreateSimulationStream = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const validatedInput = simulationRequestSchema.parse(request.body);
    const streamStartedAt = Date.now();
    const { metadata, bankPromises } = this.simulationService.startSimulation(
      validatedInput,
      request.log
    );

    const existingHeaders = reply.getHeaders();
    for (const [headerName, headerValue] of Object.entries(existingHeaders)) {
      if (headerValue !== undefined) {
        reply.raw.setHeader(headerName, headerValue);
      }
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.statusCode = 200;

    reply.hijack();
    reply.raw.flushHeaders();

    let clientDisconnected = false;
    const isConnectionClosed = (): boolean =>
      clientDisconnected || reply.raw.destroyed || reply.raw.writableEnded;

    const handleClose = (): void => {
      if (!reply.raw.writableEnded) {
        clientDisconnected = true;
      }
    };

    reply.raw.on('close', handleClose);

    const keepAliveTimer = setInterval(() => {
      if (!isConnectionClosed()) {
        reply.raw.write(': keep-alive\n\n');
      }
    }, SSE_KEEP_ALIVE_INTERVAL_MS);

    if (typeof keepAliveTimer.unref === 'function') {
      keepAliveTimer.unref();
    }

    let resultsCount = 0;
    let firstResultMs: number | null = null;

    try {
      writeSse(reply.raw, 'meta', metadata);

      const pending = new Set<Promise<WrappedBankCompletion>>();
      for (const promise of bankPromises) {
        const wrapper: Promise<WrappedBankCompletion> = promise.then((completion) => ({
          wrapper,
          completion
        }));
        pending.add(wrapper);
      }

      while (pending.size > 0 && !isConnectionClosed()) {
        const next = await Promise.race(pending);
        pending.delete(next.wrapper);

        if (isConnectionClosed()) {
          break;
        }

        resultsCount += 1;
        if (firstResultMs === null) {
          firstResultMs = Math.max(1, Date.now() - streamStartedAt);
        }

        writeSse(reply.raw, 'bank-result', {
          simulationId: metadata.simulationId,
          result: next.completion.result
        });
      }

      if (!isConnectionClosed()) {
        writeSse(reply.raw, 'complete', {
          simulationId: metadata.simulationId,
          completedAt: new Date().toISOString(),
          resultsCount
        });
        reply.raw.end();
      }

      request.log.info(
        {
          simulationId: metadata.simulationId,
          resultsCount,
          firstResultMs,
          totalElapsedMs: Math.max(1, Date.now() - streamStartedAt),
          disconnected: clientDisconnected
        },
        'Stream de simulação finalizado'
      );
    } finally {
      clearInterval(keepAliveTimer);
      reply.raw.off('close', handleClose);

      if (!reply.raw.writableEnded && !reply.raw.destroyed) {
        reply.raw.end();
      }
    }
  };
}
