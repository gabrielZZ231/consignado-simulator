import { IntegrationUnavailableError } from '../errors/app-error.js';
import { calculatePriceInstallment, roundCurrency } from '../services/price-calculator.service.js';
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

export const BANCO_BETA_RULES = {
  BANK_CODE: 'banco-beta',
  BANK_NAME: 'Banco Beta',
  MONTHLY_RATE: 0.0198,
  MIN_AMOUNT: 1_000,
  MAX_AMOUNT: 120_000,
  MIN_INSTALLMENTS: 12,
  MAX_INSTALLMENTS: 84,
  MAX_SALARY_COMMITMENT_RATIO: 0.35
} as const;

export interface BancoBetaRawResponse {
  institution: {
    id: 'BETA';
    displayName: 'Banco Beta';
  };
  decision: {
    outcome: 'ELIGIBLE' | 'DECLINED';
    reasonCode: SimulationReasonCode;
    explanation: string;
  };
  proposal?: {
    monthlyRate: number;
    principalCents: number;
    installmentCents: number;
    totalCents: number;
    termMonths: number;
  };
}

export function normalizeBancoBetaResponse(
  raw: BancoBetaRawResponse,
  responseTimeMs: number
): BankSimulationResult {
  if (raw.decision.outcome === 'ELIGIBLE' && raw.proposal) {
    return {
      bankCode: BANCO_BETA_RULES.BANK_CODE,
      bankName: raw.institution.displayName,
      status: 'approved',
      monthlyInterestRate: raw.proposal.monthlyRate,
      installmentAmount: roundCurrency(raw.proposal.installmentCents / 100),
      approvedAmount: roundCurrency(raw.proposal.principalCents / 100),
      installments: raw.proposal.termMonths,
      totalAmount: roundCurrency(raw.proposal.totalCents / 100),
      message: raw.decision.explanation,
      reasonCode: 'APPROVED',
      responseTimeMs
    };
  }

  return {
    bankCode: BANCO_BETA_RULES.BANK_CODE,
    bankName: raw.institution.displayName,
    status: 'rejected',
    monthlyInterestRate: null,
    installmentAmount: null,
    approvedAmount: null,
    installments: null,
    totalAmount: null,
    message: raw.decision.explanation,
    reasonCode: raw.decision.reasonCode,
    responseTimeMs
  };
}

export class BancoBetaIntegration implements BankIntegration {
  public readonly bankCode = BANCO_BETA_RULES.BANK_CODE;
  public readonly bankName = BANCO_BETA_RULES.BANK_NAME;
  public readonly timeoutMs: number;
  private readonly options: BankIntegrationOptions;
  private readonly configuredFailureMode: FailureMode;

  constructor(options: BankIntegrationOptions = {}) {
    this.options = options;
    const envTimeout = Number(process.env.BANK_TIMEOUT_MS);
    this.timeoutMs =
      options.timeoutMs ??
      (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_BANK_TIMEOUT_MS);

    const envLatency = Number(process.env.BANCO_BETA_LATENCY_MS);
    if (options.latencyMs === undefined && Number.isFinite(envLatency) && envLatency >= 0) {
      this.options = { ...options, latencyMs: envLatency };
    }

    this.configuredFailureMode =
      options.failureMode ?? parseFailureMode(process.env.BANCO_BETA_FAILURE_MODE);
  }

  public async simulate(request: SimulationRequest): Promise<BankSimulationResult> {
    const startedAt = Date.now();

    return withTimeout(
      async () => {
        const failureMode = resolveEffectiveFailureMode(
          this.configuredFailureMode,
          request.email,
          'beta'
        );

        if (failureMode === 'timeout') {
          await delay(this.timeoutMs + 100);
        }

        const latencyMs = resolveLatencyMs(this.options, 120, 320);
        await delay(latencyMs);

        if (failureMode === 'error') {
          throw new IntegrationUnavailableError(
            this.bankCode,
            'Falha simulada de comunicação com o motor fictício do Banco Beta.'
          );
        }

        const rawResponse = this.evaluateRules(request);
        const responseTimeMs = Math.max(1, Date.now() - startedAt);
        return normalizeBancoBetaResponse(rawResponse, responseTimeMs);
      },
      this.timeoutMs,
      this.bankCode
    );
  }

  public evaluateRules(request: SimulationRequest): BancoBetaRawResponse {
    if (request.requestedAmount < BANCO_BETA_RULES.MIN_AMOUNT) {
      return {
        institution: { id: 'BETA', displayName: 'Banco Beta' },
        decision: {
          outcome: 'DECLINED',
          reasonCode: 'AMOUNT_BELOW_MIN',
          explanation:
            'Valor solicitado abaixo do mínimo fictício operado pelo Banco Beta (mínimo de R$ 1.000,00).'
        }
      };
    }

    if (request.requestedAmount > BANCO_BETA_RULES.MAX_AMOUNT) {
      return {
        institution: { id: 'BETA', displayName: 'Banco Beta' },
        decision: {
          outcome: 'DECLINED',
          reasonCode: 'AMOUNT_EXCEEDS_MAX',
          explanation:
            'Valor solicitado acima do teto fictício operado pelo Banco Beta (máximo de R$ 120.000,00).'
        }
      };
    }

    if (
      request.installments < BANCO_BETA_RULES.MIN_INSTALLMENTS ||
      request.installments > BANCO_BETA_RULES.MAX_INSTALLMENTS
    ) {
      return {
        institution: { id: 'BETA', displayName: 'Banco Beta' },
        decision: {
          outcome: 'DECLINED',
          reasonCode: 'TERM_OUT_OF_RANGE',
          explanation: 'Prazo fora da faixa fictícia do Banco Beta (permitido de 12 a 84 parcelas).'
        }
      };
    }

    const { installmentAmount, totalAmount } = calculatePriceInstallment({
      principal: request.requestedAmount,
      monthlyInterestRate: BANCO_BETA_RULES.MONTHLY_RATE,
      installments: request.installments
    });

    const maxAllowedInstallment = request.salary * BANCO_BETA_RULES.MAX_SALARY_COMMITMENT_RATIO;

    if (installmentAmount > maxAllowedInstallment) {
      return {
        institution: { id: 'BETA', displayName: 'Banco Beta' },
        decision: {
          outcome: 'DECLINED',
          reasonCode: 'MARGIN_EXCEEDED',
          explanation:
            'Parcela estimada excede o limite fictício de 35% da renda informada no Banco Beta.'
        }
      };
    }

    return {
      institution: { id: 'BETA', displayName: 'Banco Beta' },
      decision: {
        outcome: 'ELIGIBLE',
        reasonCode: 'APPROVED',
        explanation:
          'Proposta aprovada nas regras fictícias do Banco Beta (valores meramente estimativos).'
      },
      proposal: {
        monthlyRate: BANCO_BETA_RULES.MONTHLY_RATE,
        principalCents: Math.round(request.requestedAmount * 100),
        installmentCents: Math.round(installmentAmount * 100),
        totalCents: Math.round(totalAmount * 100),
        termMonths: request.installments
      }
    };
  }
}
