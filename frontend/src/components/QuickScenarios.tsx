import { Sparkles } from 'lucide-react';
import {
  formatCnpjMask,
  formatCpfMask,
  numberToCurrencyInputMask
} from '../schemas/formatters';
import type { SimulationFormValues } from '../schemas/simulation.schema';

export interface DemoPreset {
  id: string;
  label: string;
  description: string;
  values: SimulationFormValues;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'both-approved',
    label: 'Aprovar nos dois bancos',
    description: 'Salário R$ 5.500, Valor R$ 10.000 em 24x (atende Alfa e Beta)',
    values: {
      name: 'Maria Clara Oliveira',
      email: 'maria.oliveira@exemplo.com.br',
      cpf: formatCpfMask('52998224725'),
      cnpj: formatCnpjMask('11222333000181'),
      salaryMasked: numberToCurrencyInputMask(5500),
      requestedAmountMasked: numberToCurrencyInputMask(10000),
      installments: 24
    }
  },
  {
    id: 'alfa-approved-beta-rejected',
    label: 'Aprovar Alfa / Reprovar Beta',
    description: 'Valor R$ 800 em 6x (abaixo do mínimo de R$ 1.000 e 12x do Beta)',
    values: {
      name: 'Carlos Eduardo Santos',
      email: 'carlos.santos@exemplo.com.br',
      cpf: formatCpfMask('52998224725'),
      cnpj: formatCnpjMask('11222333000181'),
      salaryMasked: numberToCurrencyInputMask(4500),
      requestedAmountMasked: numberToCurrencyInputMask(800),
      installments: 6
    }
  },
  {
    id: 'alfa-rejected-beta-approved',
    label: 'Reprovar Alfa / Aprovar Beta',
    description: 'Valor R$ 60.000 em 60x (acima do teto de R$ 50k e 48x do Alfa)',
    values: {
      name: 'Fernanda Lima Costa',
      email: 'fernanda.costa@exemplo.com.br',
      cpf: formatCpfMask('52998224725'),
      cnpj: formatCnpjMask('11222333000181'),
      salaryMasked: numberToCurrencyInputMask(6500),
      requestedAmountMasked: numberToCurrencyInputMask(60000),
      installments: 60
    }
  },
  {
    id: 'alfa-error-beta-success',
    label: 'Falha no Alfa / Sucesso no Beta',
    description: 'Aciona falha técnica controlada no Banco Alfa',
    values: {
      name: 'Roberto Almeida',
      email: 'roberto+erro-alfa@exemplo.com.br',
      cpf: formatCpfMask('52998224725'),
      cnpj: formatCnpjMask('11222333000181'),
      salaryMasked: numberToCurrencyInputMask(5500),
      requestedAmountMasked: numberToCurrencyInputMask(10000),
      installments: 24
    }
  },
  {
    id: 'alfa-success-beta-timeout',
    label: 'Sucesso no Alfa / Timeout no Beta',
    description: 'Aciona timeout controlado no Banco Beta',
    values: {
      name: 'Juliana Pereira',
      email: 'juliana+timeout-beta@exemplo.com.br',
      cpf: formatCpfMask('52998224725'),
      cnpj: formatCnpjMask('11222333000181'),
      salaryMasked: numberToCurrencyInputMask(5500),
      requestedAmountMasked: numberToCurrencyInputMask(10000),
      installments: 24
    }
  }
];

interface QuickScenariosProps {
  selectedPresetId: string | null;
  disabled?: boolean;
  onSelectPreset: (preset: DemoPreset) => void;
}

export function QuickScenarios({
  selectedPresetId,
  disabled = false,
  onSelectPreset
}: QuickScenariosProps) {
  return (
    <div className="rounded-xl border border-[#00B8DC]/20 bg-[#F4F8FB] p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#062B45]">
        <Sparkles className="h-3.5 w-3.5 text-[#00B8DC]" aria-hidden="true" />
        <span>Cenários rápidos de demonstração (preenche o formulário sem enviar):</span>
      </div>

      <div
        role="group"
        aria-label="Cenários rápidos para preenchimento do formulário"
        className="mt-2.5 flex flex-wrap gap-2"
      >
        {DEMO_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              className={[
                'inline-flex min-h-[34px] items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'border-[#062B45] bg-[#062B45] text-white shadow-2xs'
                  : 'border-slate-300 bg-white text-[#102A43] hover:border-[#00B8DC] hover:bg-[#18CBBE]/10'
              ].join(' ')}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
