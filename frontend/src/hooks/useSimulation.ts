import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSimulation,
  shouldUseSimulationStream,
  SimulationApiError,
  streamSimulation
} from '../services/simulation.api';
import type {
  BankSimulationResult,
  SimulationRequestPayload,
  SimulationStreamMetadata
} from '../types/simulation.types';

export type SimulationViewState = 'idle' | 'submitting' | 'success' | 'error';

export interface StreamingSimulationData extends SimulationStreamMetadata {
  resultsByBankCode: Record<string, BankSimulationResult>;
  isComplete: boolean;
}

export interface UseSimulationReturn {
  status: SimulationViewState;
  data: StreamingSimulationData | null;
  errorMessage: string | null;
  fieldErrors: Array<{ field: string; message: string }>;
  submitSimulation: (payload: SimulationRequestPayload) => Promise<void>;
  resetSimulation: () => void;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (error as { name?: string }).name === 'AbortError';
}

export const STREAM_INTERRUPTED_MESSAGE =
  'A conexão foi interrompida; os resultados já recebidos continuam disponíveis.';

export function useSimulation(): UseSimulationReturn {
  const [status, setStatus] = useState<SimulationViewState>('idle');
  const [data, setData] = useState<StreamingSimulationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Array<{ field: string; message: string }>>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const submitSimulation = useCallback(async (payload: SimulationRequestPayload) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    setStatus('submitting');
    setData(null);
    setErrorMessage(null);
    setFieldErrors([]);

    if (!shouldUseSimulationStream()) {
      try {
        const consolidated = await createSimulation(payload);
        if (activeRequestIdRef.current !== requestId) return;

        const resultsByBankCode: Record<string, BankSimulationResult> = {};
        for (const item of consolidated.results) {
          resultsByBankCode[item.bankCode] = item;
        }

        setData({
          simulationId: consolidated.simulationId,
          createdAt: consolidated.createdAt,
          disclaimer: consolidated.disclaimer,
          inputSummary: consolidated.inputSummary,
          banks: consolidated.results.map((r) => ({
            bankCode: r.bankCode,
            bankName: r.bankName
          })),
          resultsByBankCode,
          isComplete: true
        });
        setStatus('success');
      } catch (error) {
        if (activeRequestIdRef.current !== requestId || isAbortError(error)) return;
        if (error instanceof SimulationApiError) {
          setErrorMessage(error.message);
          setFieldErrors(error.details ?? []);
        } else {
          setErrorMessage('Ocorreu um erro inesperado ao comunicar com a API.');
        }
        setStatus('error');
      }
      return;
    }

    let metaReceived = false;
    let completeReceived = false;
    let explicitStreamErrorMessage: string | null = null;

    try {
      await streamSimulation(
        payload,
        {
          onMeta: (metadata) => {
            if (activeRequestIdRef.current !== requestId) return;
            metaReceived = true;
            setData({
              ...metadata,
              resultsByBankCode: {},
              isComplete: false
            });
            setStatus('submitting');
          },
          onBankResult: ({ result }) => {
            if (activeRequestIdRef.current !== requestId) return;
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                resultsByBankCode: {
                  ...prev.resultsByBankCode,
                  [result.bankCode]: result
                }
              };
            });
          },
          onComplete: () => {
            if (activeRequestIdRef.current !== requestId) return;
            completeReceived = true;
            setData((prev) => (prev ? { ...prev, isComplete: true } : prev));
            setStatus('success');
          },
          onError: (errPayload) => {
            if (activeRequestIdRef.current !== requestId) return;
            explicitStreamErrorMessage = errPayload.message;
          }
        },
        controller.signal
      );

      if (activeRequestIdRef.current !== requestId || controller.signal.aborted) {
        return;
      }

      if (metaReceived && !completeReceived) {
        setErrorMessage(STREAM_INTERRUPTED_MESSAGE);
        setStatus('error');
      }
    } catch (error) {
      if (
        activeRequestIdRef.current !== requestId ||
        controller.signal.aborted ||
        isAbortError(error)
      ) {
        return;
      }

      if (metaReceived && !explicitStreamErrorMessage) {
        setErrorMessage(STREAM_INTERRUPTED_MESSAGE);
        setStatus('error');
        return;
      }

      if (error instanceof SimulationApiError) {
        setErrorMessage(error.message);
        setFieldErrors(error.details ?? []);
      } else {
        setErrorMessage('Ocorreu um erro inesperado ao comunicar com a API.');
      }
      setStatus('error');
    }
  }, []);

  const resetSimulation = useCallback(() => {
    activeRequestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setStatus('idle');
    setData(null);
    setErrorMessage(null);
    setFieldErrors([]);
  }, []);

  return {
    status,
    data,
    errorMessage,
    fieldErrors,
    submitSimulation,
    resetSimulation
  };
}
