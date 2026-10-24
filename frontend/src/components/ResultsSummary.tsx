import { AlertTriangle, Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { BankSimulationResult } from '../types/simulation.types';

interface ResultsSummaryProps {
  results: BankSimulationResult[];
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalConsulted = results.length;
  const approvedCount = results.filter((r) => r.status === 'approved').length;
  const rejectedCount = results.filter((r) => r.status === 'rejected').length;
  const unavailableCount = results.filter((r) => r.status === 'unavailable').length;

  return (
    <div
      role="region"
      aria-label="Resumo quantitativo das instituições consultadas"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
    >
      <div className="rounded-xl border border-slate-200 bg-[#F4F8FB] p-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Consultadas</span>
          <Building2 className="h-4 w-4 text-[#062B45]" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xl font-extrabold text-[#102A43]">{totalConsulted}</p>
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
        <div className="flex items-center justify-between text-xs font-medium text-teal-900">
          <span>Aprovados</span>
          <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xl font-extrabold text-teal-900">{approvedCount}</p>
      </div>

      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
        <div className="flex items-center justify-between text-xs font-medium text-rose-900">
          <span>Reprovados</span>
          <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xl font-extrabold text-rose-900">{rejectedCount}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
        <div className="flex items-center justify-between text-xs font-medium text-amber-900">
          <span>Indisponíveis</span>
          <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xl font-extrabold text-amber-900">{unavailableCount}</p>
      </div>
    </div>
  );
}
