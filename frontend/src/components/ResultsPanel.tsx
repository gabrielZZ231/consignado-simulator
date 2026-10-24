import {
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  FileSearch,
  Loader2,
  RotateCcw
} from 'lucide-react';
import type {
  SimulationViewState,
  StreamingSimulationData
} from '../hooks/useSimulation';
import { formatCurrencyBRL } from '../schemas/formatters';
import type { BankSimulationResult } from '../types/simulation.types';
import { BankResultCard } from './BankResultCard';
import { BankResultSkeleton } from './BankResultSkeleton';
import { ResultsSummary } from './ResultsSummary';

interface ResultsPanelProps {
  status: SimulationViewState;
  data: StreamingSimulationData | null;
  errorMessage: string | null;
  fieldErrors: Array<{ field: string; message: string }>;
  onReset: () => void;
}

export function ResultsPanel({
  status,
  data,
  errorMessage,
  fieldErrors,
  onReset
}: ResultsPanelProps) {
  const orderedReceivedResults: BankSimulationResult[] = data
    ? data.banks
        .map((bank) => data.resultsByBankCode[bank.bankCode])
        .filter((result): result is BankSimulationResult => Boolean(result))
    : [];

  const pendingCount = data ? Math.max(0, data.banks.length - orderedReceivedResults.length) : 0;
  const canStartNewSimulation = status === 'success' || status === 'error';

  return (
    <section
      aria-labelledby="results-heading"
      aria-live="polite"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#062B45]/10 text-[#062B45]">
            <BarChart3 className="h-5 w-5 text-[#062B45]" aria-hidden="true" />
          </span>
          <div>
            <h2 id="results-heading" className="text-lg font-bold text-[#102A43] sm:text-xl">
              Resultado Consolidado
            </h2>
            <p className="text-xs text-slate-600">
              Retorno progressivo e individualizado por instituição financeira
            </p>
          </div>
        </div>

        {canStartNewSimulation && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#00B8DC]/40 bg-[#F4F8FB] px-3 py-1.5 text-xs font-semibold text-[#062B45] transition hover:bg-[#18CBBE]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC]"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#00B8DC]" aria-hidden="true" />
            <span>Nova simulação</span>
          </button>
        )}
      </div>

      {status === 'idle' && !data && (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F8FB] text-[#062B45] ring-1 ring-[#00B8DC]/25">
            <FileSearch className="h-8 w-8 text-[#00B8DC]" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#102A43]">
            Nenhuma simulação realizada ainda.
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-600 sm:text-sm">
            Preencha os campos do formulário ou selecione um cenário rápido ao lado e clique em{' '}
            <strong className="font-semibold text-[#062B45]">&ldquo;Simular agora&rdquo;</strong>{' '}
            para consultar as instituições.
          </p>
        </div>
      )}

      {status === 'submitting' && !data && (
        <div role="status" aria-label="Iniciando simulação" className="mt-5 space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#00B8DC]/30 bg-[#F4F8FB] px-4 py-3 text-xs font-semibold text-[#062B45]">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00B8DC]" aria-hidden="true" />
            <span>Iniciando conexão e validando parâmetros da simulação...</span>
          </div>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-950"
        >
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            <div>
              <p className="font-bold">
                {data
                  ? 'Conexão interrompida durante o recebimento'
                  : 'Não foi possível concluir a simulação'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-900 sm:text-sm">
                {errorMessage}
              </p>
              {fieldErrors.length > 0 && (
                <ul className="mt-2.5 list-disc space-y-1 pl-5 text-xs text-rose-900">
                  {fieldErrors.map((err, idx) => (
                    <li key={`${err.field}-${idx}`}>
                      <strong>{err.field}:</strong> {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-5">
          {status === 'submitting' && pendingCount > 0 && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-xl border border-[#00B8DC]/30 bg-[#F4F8FB] px-4 py-2.5 text-xs font-semibold text-[#062B45]"
            >
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-[#00B8DC]"
                aria-hidden="true"
              />
              <span>Consultando {pendingCount} instituição(ões)...</span>
            </div>
          )}

          {data.isComplete && (
            <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-2.5 text-xs font-semibold text-teal-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span>Consulta concluída.</span>
            </div>
          )}

          {orderedReceivedResults.length > 0 && (
            <ResultsSummary results={orderedReceivedResults} />
          )}

          <div className="rounded-xl border border-slate-200/80 bg-[#F4F8FB] p-3.5 text-xs text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong className="text-[#102A43]">Protocolo:</strong>{' '}
                <code className="font-mono text-[#062B45]">{data.simulationId}</code>
              </span>
              <span>
                <strong className="text-[#102A43]">Data:</strong>{' '}
                {new Date(data.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="mt-1.5 text-[#102A43]">
              <strong>Parâmetros consultados:</strong>{' '}
              {formatCurrencyBRL(data.inputSummary.requestedAmount)} em{' '}
              {data.inputSummary.installments} parcelas.
            </p>
          </div>

          <div className="space-y-4">
            {data.banks.map((bank) => {
              const bankResult = data.resultsByBankCode[bank.bankCode];
              if (bankResult) {
                return <BankResultCard key={bank.bankCode} result={bankResult} />;
              }
              return <BankResultSkeleton key={bank.bankCode} bank={bank} />;
            })}
          </div>

          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            {data.disclaimer}
          </p>
        </div>
      )}
    </section>
  );
}
