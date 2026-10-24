import { IntegrationUnavailableError } from '../errors/app-error.js';
import { calculatePriceInstallment } from '../services/price-calculator.service.js';
import type {
  BankIntegrationOptions,
  BankSimulationResult,
  FailureMode,
  SimulationReasonCode,
  SimulationRequest
} from '../types/simulation.types.js';
import {
  DEFAULT_BANK_TIMEOUT_MS,
  type BankIntegration,
  delay,
  parseFailureMode,
  resolveEffectiveFailureMode,
  resolveLatencyMs,
  withTimeout
} from './bank-integration.interface.js';

export const BANCO_ALFA_RULES = {
  BANK_CODE: 'banco-alfa',
  BANK_NAME: 'Banco Alfa',
  MONTHLY_RATE: 0.0175,
  MAX_AMOUNT: 50_000,
  MIN_INSTALLMENTS: 6,
  MAX_INSTALLMENTS: 48,
  MAX_SALARY_COMMITMENT_RATIO: 0.3
} as const;

export interface BancoAlfaRawResponse {
  codigo_instituicao: 'ALFA';
  nome_instituicao: 'Banco Alfa';
  situacao_proposta: 'APROVADA' | 'RECUSADA';
  taxa_juros_mensal?: number;
  condicoes_aprovadas?: {
    valor_financiado: number;
    prazo_meses: number;
    valor_parcela_fixa: number;
    valor_total_estimado: number;
  };
  motivo_recusa?: {
    codigo: SimulationReasonCode;
    descricao: string;
  };
}

export function normalizeBancoAlfaResponse(
  raw: BancoAlfaRawResponse,
  responseTimeMs: number
): BankSimulationResult {
  if (raw.situacao_proposta === 'APROVADA' && raw.condicoes_aprovadas) {
    return {
      bankCode: BANCO_ALFA_RULES.BANK_CODE,
      bankName: raw.nome_instituicao,
      status: 'approved',
      monthlyInterestRate: raw.taxa_juros_mensal ?? BANCO_ALFA_RULES.MONTHLY_RATE,
      installmentAmount: raw.condicoes_aprovadas.valor_parcela_fixa,
      approvedAmount: raw.condicoes_aprovadas.valor_financiado,
      installments: raw.condicoes_aprovadas.prazo_meses,
      totalAmount: raw.condicoes_aprovadas.valor_total_estimado,
      message:
        'Proposta aprovada nas regras fictícias do Banco Alfa (valores meramente estimativos).',
      reasonCode: 'APPROVED',
      responseTimeMs
    };
  }

  return {
    bankCode: BANCO_ALFA_RULES.BANK_CODE,
    bankName: raw.nome_instituicao,
    status: 'rejected',
    monthlyInterestRate: null,
    installmentAmount: null,
    approvedAmount: null,
    installments: null,
    totalAmount: null,
    message:
      raw.motivo_recusa?.descricao ??
      'Proposta não elegível nos critérios fictícios do Banco Alfa.',
    reasonCode: raw.motivo_recusa?.codigo ?? 'MARGIN_EXCEEDED',
    responseTimeMs
  };
}

export class BancoAlfaIntegration implements BankIntegration {
  public readonly bankCode = BANCO_ALFA_RULES.BANK_CODE;
  public readonly bankName = BANCO_ALFA_RULES.BANK_NAME;
  public readonly timeoutMs: number;
  private readonly options: BankIntegrationOptions;
  private readonly configuredFailureMode: FailureMode;

  constructor(options: BankIntegrationOptions = {}) {
    this.options = options;
    const envTimeout = Number(process.env.BANK_TIMEOUT_MS);
    this.timeoutMs =
      options.timeoutMs ??
      (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_BANK_TIMEOUT_MS);

    const envLatency = Number(process.env.BANCO_ALFA_LATENCY_MS);
    if (options.latencyMs === undefined && Number.isFinite(envLatency) && envLatency >= 0) {
      this.options = { ...options, latencyMs: envLatency };
    }

    this.configuredFailureMode =
      options.failureMode ?? parseFailureMode(process.env.BANCO_ALFA_FAILURE_MODE);
  }

  public async simulate(request: SimulationRequest): Promise<BankSimulationResult> {
    const startedAt = Date.now();

    return withTimeout(
      async () => {
        const failureMode = resolveEffectiveFailureMode(
          this.configuredFailureMode,
          request.email,
          'alfa'
        );

        if (failureMode === 'timeout') {
          await delay(this.timeoutMs + 100);
        }

        const latencyMs = resolveLatencyMs(this.options, 80, 220);
        await delay(latencyMs);

        if (failureMode === 'error') {
          throw new IntegrationUnavailableError(
            this.bankCode,
            'Falha simulada de comunicação com o motor fictício do Banco Alfa.'
          );
        }

        const rawResponse = this.evaluateRules(request);
        const responseTimeMs = Math.max(1, Date.now() - startedAt);
        return normalizeBancoAlfaResponse(rawResponse, responseTimeMs);
      },
      this.timeoutMs,
      this.bankCode
    );
  }

  public evaluateRules(request: SimulationRequest): BancoAlfaRawResponse {
    if (request.requestedAmount > BANCO_ALFA_RULES.MAX_AMOUNT) {
      return {
        codigo_instituicao: 'ALFA',
        nome_instituicao: 'Banco Alfa',
        situacao_proposta: 'RECUSADA',
        motivo_recusa: {
          codigo: 'AMOUNT_EXCEEDS_MAX',
          descricao:
            'Valor solicitado acima do teto fictício do Banco Alfa (máximo de R$ 50.000,00).'
        }
      };
    }

    if (
      request.installments < BANCO_ALFA_RULES.MIN_INSTALLMENTS ||
      request.installments > BANCO_ALFA_RULES.MAX_INSTALLMENTS
    ) {
      return {
        codigo_instituicao: 'ALFA',
        nome_instituicao: 'Banco Alfa',
        situacao_proposta: 'RECUSADA',
        motivo_recusa: {
          codigo: 'TERM_OUT_OF_RANGE',
          descricao: 'Prazo fora da faixa fictícia do Banco Alfa (permitido de 6 a 48 parcelas).'
        }
      };
    }

    const { installmentAmount, totalAmount } = calculatePriceInstallment({
      principal: request.requestedAmount,
      monthlyInterestRate: BANCO_ALFA_RULES.MONTHLY_RATE,
      installments: request.installments
    });

    const maxAllowedInstallment = request.salary * BANCO_ALFA_RULES.MAX_SALARY_COMMITMENT_RATIO;

    if (installmentAmount > maxAllowedInstallment) {
      return {
        codigo_instituicao: 'ALFA',
        nome_instituicao: 'Banco Alfa',
        situacao_proposta: 'RECUSADA',
        motivo_recusa: {
          codigo: 'MARGIN_EXCEEDED',
          descricao:
            'Parcela estimada excede o limite fictício de 30% da renda informada no Banco Alfa.'
        }
      };
    }

    return {
      codigo_instituicao: 'ALFA',
      nome_instituicao: 'Banco Alfa',
      situacao_proposta: 'APROVADA',
      taxa_juros_mensal: BANCO_ALFA_RULES.MONTHLY_RATE,
      condicoes_aprovadas: {
        valor_financiado: request.requestedAmount,
        prazo_meses: request.installments,
        valor_parcela_fixa: installmentAmount,
        valor_total_estimado: totalAmount
      }
    };
  }
}
