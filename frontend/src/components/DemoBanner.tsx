import { Info } from 'lucide-react';

export function DemoBanner() {
  return (
    <div
      role="region"
      aria-label="Aviso de ambiente fictício de demonstração"
      className="border-b border-[#00B8DC]/20 bg-[#EBF4FA] text-[#102A43]"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2 text-xs leading-snug sm:px-6 sm:text-[13px] lg:px-8">
        <Info className="h-4 w-4 shrink-0 text-[#062B45]" aria-hidden="true" />
        <p className="font-medium text-[#102A43]">
          Ambiente fictício de demonstração. Nenhuma consulta real de crédito é realizada. Os
          valores apresentados são estimativas e não constituem oferta de empréstimo.
        </p>
      </div>
    </div>
  );
}
