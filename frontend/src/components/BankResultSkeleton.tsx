import { Building2, Loader2 } from 'lucide-react';
import type { SimulationBankDescriptor } from '../types/simulation.types';

interface BankResultSkeletonProps {
  bank: SimulationBankDescriptor;
}

export function BankResultSkeleton({ bank }: BankResultSkeletonProps) {
  return (
    <article
      role="status"
      aria-label={`Consultando ${bank.bankName}`}
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#062B45]/80 text-white">
            <Building2 className="h-4 w-4 text-[#18CBBE]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#102A43]">{bank.bankName}</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{bank.bankCode}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00B8DC]/30 bg-[#F4F8FB] px-3 py-1 text-xs font-semibold text-[#062B45]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00B8DC]" aria-hidden="true" />
          <span>Consultando...</span>
        </span>
      </div>

      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="h-16 animate-pulse rounded-xl bg-slate-200/80" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-11 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-11 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-11 animate-pulse rounded-lg bg-slate-200/70" />
        </div>
      </div>
    </article>
  );
}
