import { Building2, Scale } from 'lucide-react';

interface BankRuleSpec {
  bankName: string;
  profileLabel: string;
  rate: string;
  amountLimit: string;
  termRange: string;
  marginLimit: string;
}

const BANK_RULES: BankRuleSpec[] = [
  {
    bankName: 'Banco Alfa',
    profileLabel: 'Perfil Conservador',
    rate: '1,75% a.m.',
    amountLimit: 'Até R$ 50.000,00',
    termRange: '6 a 48 parcelas',
    marginLimit: 'Até 30% do salário'
  },
  {
    bankName: 'Banco Beta',
    profileLabel: 'Perfil Flexível',
    rate: '1,98% a.m.',
    amountLimit: 'R$ 1.000,00 a R$ 120.000,00',
    termRange: '12 a 84 parcelas',
    marginLimit: 'Até 35% do salário'
  }
];

export function BankRules() {
  return (
    <aside
      aria-labelledby="rules-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Scale className="h-4 w-4 text-[#00B8DC]" aria-hidden="true" />
        <h2 id="rules-heading" className="text-sm font-bold text-[#102A43] sm:text-base">
          Regras fictícias configuradas nos bancos
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BANK_RULES.map((rule) => (
          <div
            key={rule.bankName}
            className="rounded-xl border border-slate-200/80 bg-[#F4F8FB] p-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#062B45]" aria-hidden="true" />
                <h3 className="text-sm font-bold text-[#062B45]">{rule.bankName}</h3>
              </div>
              <span className="rounded-md bg-[#062B45]/10 px-2 py-0.5 text-[11px] font-semibold text-[#062B45]">
                {rule.profileLabel}
              </span>
            </div>

            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Taxa simulada:</dt>
                <dd className="font-semibold text-[#102A43]">{rule.rate}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Limite de valor:</dt>
                <dd className="font-semibold text-[#102A43]">{rule.amountLimit}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Prazo permitido:</dt>
                <dd className="font-semibold text-[#102A43]">{rule.termRange}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Margem fictícia:</dt>
                <dd className="font-semibold text-[#102A43]">{rule.marginLimit}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </aside>
  );
}
