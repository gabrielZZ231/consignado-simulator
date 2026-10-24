import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { SimulationReasonCode, SimulationStatus } from '../types/simulation.types';

interface StatusBadgeProps {
  status: SimulationStatus;
  reasonCode: SimulationReasonCode;
}

export function StatusBadge({ status, reasonCode }: StatusBadgeProps) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
        <span>Aprovado (Simulado)</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
        <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
        <span>Reprovado</span>
      </span>
    );
  }

  const isTimeout = reasonCode === 'TIMEOUT';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
      {isTimeout ? (
        <Clock className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
      )}
      <span>Indisponível</span>
    </span>
  );
}
