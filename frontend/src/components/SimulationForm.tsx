import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Calendar,
  Eraser,
  Loader2,
  Mail,
  Send,
  SlidersHorizontal,
  User
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  formatCnpjMask,
  formatCpfMask,
  formatCurrencyInputMask,
  parseCurrencyMaskedToNumber,
  stripNonDigits
} from '../schemas/formatters';
import {
  SIMULATION_LIMITS,
  simulationFormSchema,
  type SimulationFormValues
} from '../schemas/simulation.schema';
import type { SimulationRequestPayload } from '../types/simulation.types';
import { InputField } from './InputField';
import { QuickScenarios, type DemoPreset } from './QuickScenarios';

interface SimulationFormProps {
  isSubmitting: boolean;
  onSubmitSimulation: (payload: SimulationRequestPayload) => Promise<void>;
}

const INITIAL_VALUES: SimulationFormValues = {
  name: '',
  email: '',
  cpf: '',
  cnpj: '',
  salaryMasked: '',
  requestedAmountMasked: '',
  installments: 24
};

export function SimulationForm({ isSubmitting, onSubmitSimulation }: SimulationFormProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: INITIAL_VALUES,
    mode: 'onBlur'
  });

  const handleValidSubmit = async (values: SimulationFormValues) => {
    const cleanPayload: SimulationRequestPayload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      cpf: stripNonDigits(values.cpf),
      cnpj: stripNonDigits(values.cnpj),
      salary: parseCurrencyMaskedToNumber(values.salaryMasked),
      requestedAmount: parseCurrencyMaskedToNumber(values.requestedAmountMasked),
      installments: Number(values.installments)
    };

    await onSubmitSimulation(cleanPayload);
  };

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPresetId(preset.id);
    reset(preset.values, { keepErrors: false });
  };

  const handleClearForm = () => {
    setSelectedPresetId(null);
    reset(INITIAL_VALUES, { keepErrors: false });
  };

  return (
    <section
      aria-labelledby="form-heading"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7"
    >
      <div className="mb-5 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="form-heading" className="text-lg font-bold text-[#102A43] sm:text-xl">
              Parâmetros da Simulação
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              Informe os dados abaixo ou selecione um cenário rápido para avaliar as condições de
              cada instituição.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            <span className="text-rose-600">*</span> Campos obrigatórios
          </span>
        </div>

        <div className="mt-4">
          <QuickScenarios
            selectedPresetId={selectedPresetId}
            disabled={isSubmitting}
            onSelectPreset={handleSelectPreset}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleValidSubmit)} noValidate className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#062B45] uppercase">
            <User className="h-4 w-4 text-[#00B8DC]" aria-hidden="true" />
            <span>Dados pessoais</span>
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="name"
              label="Nome completo"
              type="text"
              autoComplete="name"
              placeholder="Ex.: Maria Clara Oliveira"
              required
              disabled={isSubmitting}
              icon={<User className="h-4 w-4 text-slate-400" />}
              hint={`Mínimo de ${SIMULATION_LIMITS.NAME_MIN_LENGTH} caracteres.`}
              error={errors.name?.message}
              {...register('name')}
            />

            <InputField
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="nome@exemplo.com.br"
              required
              disabled={isSubmitting}
              icon={<Mail className="h-4 w-4 text-slate-400" />}
              hint="Utilizado apenas na requisição desta simulação."
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-100 pt-5">
          <legend className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#062B45] uppercase">
            <Briefcase className="h-4 w-4 text-[#00B8DC]" aria-hidden="true" />
            <span>Dados profissionais / convênio</span>
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="cpf"
              label="CPF"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              required
              mono
              disabled={isSubmitting}
              hint="Ex. válido: 529.982.247-25 (enviado sem pontuação)."
              error={errors.cpf?.message}
              {...register('cpf', {
                onChange: (e) => {
                  setValue('cpf', formatCpfMask(e.target.value), { shouldValidate: false });
                }
              })}
            />

            <InputField
              id="cnpj"
              label="CNPJ"
              type="text"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              required
              mono
              disabled={isSubmitting}
              hint="Ex. válido: 11.222.333/0001-81 (enviado sem pontuação)."
              error={errors.cnpj?.message}
              {...register('cnpj', {
                onChange: (e) => {
                  setValue('cnpj', formatCnpjMask(e.target.value), { shouldValidate: false });
                }
              })}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-100 pt-5">
          <legend className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#062B45] uppercase">
            <SlidersHorizontal className="h-4 w-4 text-[#00B8DC]" aria-hidden="true" />
            <span>Parâmetros da simulação</span>
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField
              id="salaryMasked"
              label="Salário mensal"
              type="text"
              inputMode="numeric"
              placeholder="5.000,00"
              required
              prefixText="R$"
              disabled={isSubmitting}
              hint={`Mínimo R$ ${SIMULATION_LIMITS.SALARY_MIN.toLocaleString('pt-BR')},00.`}
              error={errors.salaryMasked?.message}
              {...register('salaryMasked', {
                onChange: (e) => {
                  setValue('salaryMasked', formatCurrencyInputMask(e.target.value), {
                    shouldValidate: false
                  });
                }
              })}
            />

            <InputField
              id="requestedAmountMasked"
              label="Valor solicitado"
              type="text"
              inputMode="numeric"
              placeholder="10.000,00"
              required
              prefixText="R$"
              disabled={isSubmitting}
              hint={`De R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MIN.toLocaleString('pt-BR')} a R$ ${SIMULATION_LIMITS.REQUESTED_AMOUNT_MAX.toLocaleString('pt-BR')}.`}
              error={errors.requestedAmountMasked?.message}
              {...register('requestedAmountMasked', {
                onChange: (e) => {
                  setValue('requestedAmountMasked', formatCurrencyInputMask(e.target.value), {
                    shouldValidate: false
                  });
                }
              })}
            />

            <InputField
              id="installments"
              label="Quantidade de parcelas"
              type="number"
              min={SIMULATION_LIMITS.INSTALLMENTS_MIN}
              max={SIMULATION_LIMITS.INSTALLMENTS_MAX}
              step={1}
              required
              disabled={isSubmitting}
              icon={<Calendar className="h-4 w-4 text-slate-400" />}
              hint={`De ${SIMULATION_LIMITS.INSTALLMENTS_MIN} a ${SIMULATION_LIMITS.INSTALLMENTS_MAX} meses.`}
              error={errors.installments?.message}
              {...register('installments')}
            />
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClearForm}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102A43] transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eraser className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>Limpar campos</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#062B45] to-[#083B5E] px-6 py-2.5 text-sm font-semibold text-white shadow-xs ring-1 ring-[#18CBBE]/40 transition hover:from-[#041D33] hover:to-[#062B45] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B8DC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#18CBBE]" aria-hidden="true" />
                <span>Simulando...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-[#18CBBE]" aria-hidden="true" />
                <span>Simular agora</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
