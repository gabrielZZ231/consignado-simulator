import { randomUUID } from 'node:crypto';
import { IntegrationTimeoutError } from '../errors/app-error.js';
import { BancoAlfaIntegration } from '../integrations/banco-alfa.integration.js';
import { BancoBetaIntegration } from '../integrations/banco-beta.integration.js';
import type { BankIntegration } from '../integrations/bank-integration.interface.js';
import { maskCpf } from '../schemas/validators.js';
import type {
  BankSimulationResult,
  SimulationRequest,
  SimulationResponse,
  SimulationStreamMetadata
} from '../types/simulation.types.js';

export interface SimulationLogger {
  info(bindings: Record<string, unknown>, msg?: string): void;
  warn(bindings: Record<string, unknown>, msg?: string): void;
}

export interface SimulationExecutionContext {
  simulationId: string;
  cpfMasked: string;
}

export interface BankSimulationCompletion {
  integration: BankIntegration;
  result: BankSimulationResult;
}

export const FICTITIOUS_DISCLAIMER =
  'Simulação estritamente fictícia para fins de demonstração técnica. Os cálculos utilizam a Tabela Price com taxas simuladas e não constituem proposta ou análise real de crédito.';

export class SimulationService {
  private readonly integrations: BankIntegration[];

  constructor(integrations?: BankIntegration[]) {
    this.integrations = integrations ?? [
      new BancoAlfaIntegration(),
      new BancoBetaIntegration()
    ];
  }

  public prepareSimulation(
    request: SimulationRequest,
    logger?: SimulationLogger
  ): { metadata: SimulationStreamMetadata; context: SimulationExecutionContext } {
    const simulationId = randomUUID();
    const createdAt = new Date().toISOString();
    const cpfMasked = maskCpf(request.cpf);

    logger?.info(
      {
        simulationId,
        cpfMasked,
        requestedAmount: request.requestedAmount,
        installments: request.installments,
        banksCount: this.integrations.length
      },
      'Iniciando simulação fictícia de consignado'
    );

    const metadata: SimulationStreamMetadata = {
      simulationId,
      createdAt,
      disclaimer: FICTITIOUS_DISCLAIMER,
      inputSummary: {
        requestedAmount: request.requestedAmount,
        installments: request.installments
      },
      banks: this.integrations.map((integration) => ({
        bankCode: integration.bankCode,
        bankName: integration.bankName
      }))
    };

    return {
      metadata,
      context: {
        simulationId,
        cpfMasked
      }
    };
  }

  public async simulateBank(
    integration: BankIntegration,
    request: SimulationRequest,
    context: SimulationExecutionContext,
    logger?: SimulationLogger
  ): Promise<BankSimulationResult> {
    const startedAt = Date.now();

    try {
      return await integration.simulate(request);
    } catch (cause) {
      const elapsedMs = Math.max(1, Date.now() - startedAt);
      const isTimeout = cause instanceof IntegrationTimeoutError;

      logger?.warn(
        {
          simulationId: context.simulationId,
          cpfMasked: context.cpfMasked,
          bankCode: integration.bankCode,
          reasonCode: isTimeout ? 'TIMEOUT' : 'INTEGRATION_ERROR',
          elapsedMs
        },
        `Integração com ${integration.bankName} indisponível durante a simulação`
      );

      if (isTimeout) {
        return {
          bankCode: integration.bankCode,
          bankName: integration.bankName,
          status: 'unavailable',
          monthlyInterestRate: null,
          installmentAmount: null,
          approvedAmount: null,
          installments: null,
          totalAmount: null,
          message: `Tempo limite excedido ao consultar o ${integration.bankName}. Tente novamente em instantes.`,
          reasonCode: 'TIMEOUT',
          responseTimeMs: elapsedMs
        };
      }

      return {
        bankCode: integration.bankCode,
        bankName: integration.bankName,
        status: 'unavailable',
        monthlyInterestRate: null,
        installmentAmount: null,
        approvedAmount: null,
        installments: null,
        totalAmount: null,
        message: `Serviço do ${integration.bankName} temporariamente indisponível no momento da simulação.`,
        reasonCode: 'INTEGRATION_ERROR',
        responseTimeMs: elapsedMs
      };
    }
  }

  public startSimulation(
    request: SimulationRequest,
    logger?: SimulationLogger
  ): {
    metadata: SimulationStreamMetadata;
    bankPromises: Array<Promise<BankSimulationCompletion>>;
  } {
    const { metadata, context } = this.prepareSimulation(request, logger);

    const bankPromises = this.integrations.map(async (integration) => {
      const result = await this.simulateBank(integration, request, context, logger);
      return {
        integration,
        result
      };
    });

    return {
      metadata,
      bankPromises
    };
  }

  public async runSimulation(
    request: SimulationRequest,
    logger?: SimulationLogger
  ): Promise<SimulationResponse> {
    const { metadata, bankPromises } = this.startSimulation(request, logger);
    const completions = await Promise.all(bankPromises);

    return {
      simulationId: metadata.simulationId,
      createdAt: metadata.createdAt,
      disclaimer: metadata.disclaimer,
      inputSummary: metadata.inputSummary,
      results: completions.map((completion) => completion.result)
    };
  }
}
