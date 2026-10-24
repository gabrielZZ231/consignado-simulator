import { Building2, Clock, Info, ShieldAlert } from 'lucide-react';
import { formatCurrencyBRL, formatMonthlyRatePercent } from '../schemas/formatters';
import type { BankSimulationResult } from '../types/simulation.types';
import { StatusBadge } from './StatusBadge';

interface BankResultCardProps {
  result: BankSimulationResult;
}

export function BankResultCard({ result }: BankResultCardProps) {
  const isApproved = result.status === 'approved';
  const isRejected = result.status === 'rejected';
  const isTimeout = result.status === 'unavailable' && result.reasonCode === 'TIMEOUT';

  const cardThemeClass = isApproved
    ? 'border-teal-300/90 bg-gradient-to-br from-teal-50/50 via-white to-[#18CBBE]/10'
    : isRejected
      ? 'border-rose-200 bg-rose-50/25'
      : 'border-amber-300/90 bg-amber-50/30';

  return (
    <article
      aria-label={`Resultado do ${result.bankName}`}
      className={`rounded-2xl border p-5 shadow-2xs transition ${cardThemeClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#062B45] text-white">
            <Building2 className="h-4 w-4 text-[#18CBBE]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#102A43]">{result.bankName}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{result.bankCode}</span>
              {typeof result.responseTimeMs === 'number' && (
                <span className="inline-flex items-center gap-1">
                  • <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>{result.responseTimeMs} ms</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <StatusBadge status={result.status} reasonCode={result.reasonCode} />
      </div>

      {isApproved &&
        result.installmentAmount !== null &&
        result.monthlyInterestRate !== null &&
        result.approvedAmount !== null &&
        result.installments !== null &&
        result.totalAmount !== null && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-teal-200/80 bg-white p-4 shadow-2xs">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Parcela mensal estimada
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#062B45]">
                  {formatCurrencyBRL(result.installmentAmount)}
                </span>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                  {result.installments} parcelas fixas
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Taxa de juros fictícia</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#102A43]">
                  {formatMonthlyRatePercent(result.monthlyInterestRate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Valor solicitado</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#102A43]">
                  {formatCurrencyBRL(result.approvedAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Total estimado</dt>
                <dd className="mt-0.5 text-sm font-bold text-[#102A43]">
                  {formatCurrencyBRL(result.totalAmount)}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-slate-600">{result.message}</p>
          </div>
        )}

      {isRejected && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-rose-200/80 bg-white p-3.5">
            <p className="text-xs font-semibold text-rose-900">Motivo da reprovação</p>
            <p className="mt-1 text-sm text-[#102A43]">{result.message}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200/70">
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Código técnico:</span>
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-[#102A43]">
                {result.reasonCode}
              </code>
            </span>
            <span>Critério fictício não atendido</span>
          </div>
        </div>
      )}

      {result.status === 'unavailable' && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-amber-300/80 bg-white p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-700" aria-hidden="true" />
              <span>
                {isTimeout
                  ? 'Tempo limite excedido (Timeout)'
                  : 'Falha técnica na integração simulada'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#102A43]">{result.message}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200/70">
            <span>
              Diagnóstico:{' '}
              <code className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono font-semibold text-amber-950">
                {result.reasonCode}
              </code>
            </span>
            <span>Não representa reprovação de crédito</span>
          </div>
        </div>
      )}
    </article>
  );
}
