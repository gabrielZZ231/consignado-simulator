import { IntegrationTimeoutError } from '../errors/app-error.js';
import type {
  BankIntegrationOptions,
  BankSimulationResult,
  FailureMode,
  SimulationRequest
} from '../types/simulation.types.js';

export interface BankIntegration {
  readonly bankCode: string;
  readonly bankName: string;
  readonly timeoutMs: number;
  simulate(request: SimulationRequest): Promise<BankSimulationResult>;
}

export const DEFAULT_BANK_TIMEOUT_MS = 1800;

export function parseFailureMode(value: string | undefined): FailureMode {
  if (value === 'error' || value === 'timeout' || value === 'none') {
    return value;
  }
  return 'none';
}

export function resolveLatencyMs(
  options: BankIntegrationOptions,
  defaultMinMs: number,
  defaultMaxMs: number
): number {
  if (typeof options.latencyMs === 'number' && options.latencyMs >= 0) {
    return options.latencyMs;
  }

  const min = options.minLatencyMs ?? defaultMinMs;
  const max = options.maxLatencyMs ?? defaultMaxMs;
  if (max <= min) {
    return Math.max(0, min);
  }

  return Math.floor(min + Math.random() * (max - min + 1));
}

export function resolveEffectiveFailureMode(
  configuredMode: FailureMode,
  email: string,
  bankTag: 'alfa' | 'beta'
): FailureMode {
  if (configuredMode !== 'none') {
    return configuredMode;
  }

  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail.includes(`+erro-${bankTag}@`) || normalizedEmail.includes('+erro-todos@')) {
    return 'error';
  }
  if (
    normalizedEmail.includes(`+timeout-${bankTag}@`) ||
    normalizedEmail.includes('+timeout-todos@')
  ) {
    return 'timeout';
  }

  return 'none';
}

export function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  bankCode: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new IntegrationTimeoutError(bankCode, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }
}
