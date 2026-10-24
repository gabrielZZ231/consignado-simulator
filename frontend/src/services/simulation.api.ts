import type {
  ApiErrorResponse,
  BankSimulationResult,
  SimulationRequestPayload,
  SimulationResponse,
  SimulationStreamEvent,
  SimulationStreamMetadata
} from '../types/simulation.types';

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (!configured) {
    return DEFAULT_API_BASE_URL;
  }
  return configured.replace(/\/+$/, '');
}

export function shouldUseSimulationStream(): boolean {
  const rawFlag = import.meta.env.VITE_USE_SIMULATION_STREAM?.trim().toLowerCase();
  if (rawFlag === 'false' || rawFlag === '0') {
    return false;
  }
  return true;
}

export class SimulationApiError extends Error {
  public readonly statusCode?: number;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode?: number,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'SimulationApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function isValidSimulationResponse(data: unknown): data is SimulationResponse {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.simulationId === 'string' &&
    typeof candidate.createdAt === 'string' &&
    Array.isArray(candidate.results)
  );
}

function isValidStreamMetadata(data: unknown): data is SimulationStreamMetadata {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.simulationId === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.disclaimer === 'string' &&
    typeof candidate.inputSummary === 'object' &&
    candidate.inputSummary !== null &&
    Array.isArray(candidate.banks)
  );
}

function isValidBankResultPayload(
  data: unknown
): data is { simulationId: string; result: BankSimulationResult } {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  if (typeof candidate.simulationId !== 'string') return false;
  if (!candidate.result || typeof candidate.result !== 'object') return false;
  const result = candidate.result as Record<string, unknown>;
  return (
    typeof result.bankCode === 'string' &&
    typeof result.bankName === 'string' &&
    (result.status === 'approved' ||
      result.status === 'rejected' ||
      result.status === 'unavailable')
  );
}

function isValidCompletePayload(
  data: unknown
): data is { simulationId: string; completedAt: string; resultsCount: number } {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.simulationId === 'string' &&
    typeof candidate.completedAt === 'string' &&
    typeof candidate.resultsCount === 'number'
  );
}

function isValidErrorPayload(data: unknown): data is { code: string; message: string } {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

export interface SimulationStreamHandlers {
  onMeta?: (metadata: SimulationStreamMetadata) => void | Promise<void>;
  onBankResult?: (payload: {
    simulationId: string;
    result: BankSimulationResult;
  }) => void | Promise<void>;
  onComplete?: (payload: {
    simulationId: string;
    completedAt: string;
    resultsCount: number;
  }) => void | Promise<void>;
  onError?: (payload: { code: string; message: string }) => void | Promise<void>;
}

function parseSseEventBlock(rawBlock: string): SimulationStreamEvent | null {
  const lines = rawBlock.split(/\r?\n/);
  let eventName: string | null = null;
  const dataLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (eventName === null && dataLines.length === 0) {
    return null;
  }

  if (!eventName || dataLines.length === 0) {
    throw new SimulationApiError('Evento de stream malformado recebido do servidor.');
  }

  const rawJson = dataLines.join('\n');
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(rawJson);
  } catch {
    throw new SimulationApiError('Dados JSON inválidos recebidos no stream da simulação.');
  }

  if (eventName === 'meta') {
    if (!isValidStreamMetadata(parsedData)) {
      throw new SimulationApiError('Metadados inválidos recebidos no início do stream.');
    }
    return { event: 'meta', data: parsedData };
  }

  if (eventName === 'bank-result') {
    if (!isValidBankResultPayload(parsedData)) {
      throw new SimulationApiError('Resultado bancário inválido recebido no stream.');
    }
    return { event: 'bank-result', data: parsedData };
  }

  if (eventName === 'complete') {
    if (!isValidCompletePayload(parsedData)) {
      throw new SimulationApiError('Evento de conclusão inválido recebido no stream.');
    }
    return { event: 'complete', data: parsedData };
  }

  if (eventName === 'error') {
    if (!isValidErrorPayload(parsedData)) {
      throw new SimulationApiError('Evento de erro malformado recebido no stream.');
    }
    return { event: 'error', data: parsedData };
  }

  return null;
}

export async function streamSimulation(
  payload: SimulationRequestPayload,
  handlers: SimulationStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const endpoint = `${getApiBaseUrl()}/api/simulations/stream`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify(payload),
      credentials: 'include',
      signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new SimulationApiError(
      'Não foi possível conectar ao servidor de simulação. Verifique se o backend está em execução.'
    );
  }

  if (!response.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch {
      throw new SimulationApiError(
        `Falha ao processar a simulação (código HTTP ${response.status}).`,
        response.status
      );
    }

    const apiError = parsedBody as Partial<ApiErrorResponse>;
    const message =
      apiError?.error?.message ??
      `Falha ao processar a simulação (código HTTP ${response.status}).`;
    throw new SimulationApiError(message, response.status, apiError?.error?.details);
  }

  if (!response.body) {
    throw new SimulationApiError(
      'O servidor não retornou um fluxo de dados legível para a simulação.',
      response.status
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const dispatchBlock = async (block: string): Promise<void> => {
    const parsedEvent = parseSseEventBlock(block);
    if (!parsedEvent) return;

    switch (parsedEvent.event) {
      case 'meta':
        await handlers.onMeta?.(parsedEvent.data);
        break;
      case 'bank-result':
        await handlers.onBankResult?.(parsedEvent.data);
        break;
      case 'complete':
        await handlers.onComplete?.(parsedEvent.data);
        break;
      case 'error':
        await handlers.onError?.(parsedEvent.data);
        throw new SimulationApiError(parsedEvent.data.message);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const normalized = buffer.replace(/\r\n/g, '\n');
      const parts = normalized.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const block of parts) {
        if (block.trim().length > 0) {
          await dispatchBlock(block);
        }
      }
    }

    if (buffer.trim().length > 0) {
      await dispatchBlock(buffer.replace(/\r\n/g, '\n'));
    }
  } finally {
    reader.releaseLock();
  }
}

export async function createSimulation(
  payload: SimulationRequestPayload
): Promise<SimulationResponse> {
  const endpoint = `${getApiBaseUrl()}/api/simulations`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
  } catch {
    throw new SimulationApiError(
      'Não foi possível conectar ao servidor de simulação. Verifique se o backend está em execução.'
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await response.json();
  } catch {
    throw new SimulationApiError(
      'O servidor retornou uma resposta em formato inesperado.',
      response.status
    );
  }

  if (!response.ok) {
    const apiError = parsedBody as Partial<ApiErrorResponse>;
    const message =
      apiError?.error?.message ??
      `Falha ao processar a simulação (código HTTP ${response.status}).`;
    throw new SimulationApiError(message, response.status, apiError?.error?.details);
  }

  if (!isValidSimulationResponse(parsedBody)) {
    throw new SimulationApiError(
      'O formato de resposta da simulação é inválido.',
      response.status
    );
  }

  return parsedBody;
}
