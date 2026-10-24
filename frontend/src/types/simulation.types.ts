export type SimulationStatus = 'approved' | 'rejected' | 'unavailable';

export type SimulationReasonCode =
  | 'APPROVED'
  | 'AMOUNT_EXCEEDS_MAX'
  | 'AMOUNT_BELOW_MIN'
  | 'TERM_OUT_OF_RANGE'
  | 'MARGIN_EXCEEDED'
  | 'TIMEOUT'
  | 'INTEGRATION_ERROR';

export interface SimulationRequestPayload {
  name: string;
  email: string;
  cpf: string;
  cnpj: string;
  salary: number;
  requestedAmount: number;
  installments: number;
}

export interface BankSimulationResult {
  bankCode: string;
  bankName: string;
  status: SimulationStatus;
  monthlyInterestRate: number | null;
  installmentAmount: number | null;
  approvedAmount: number | null;
  installments: number | null;
  totalAmount: number | null;
  message: string;
  reasonCode: SimulationReasonCode;
  responseTimeMs: number;
}

export interface SimulationResponse {
  simulationId: string;
  createdAt: string;
  disclaimer: string;
  inputSummary: {
    requestedAmount: number;
    installments: number;
  };
  results: BankSimulationResult[];
}

export interface SimulationBankDescriptor {
  bankCode: string;
  bankName: string;
}

export interface SimulationStreamMetadata {
  simulationId: string;
  createdAt: string;
  disclaimer: string;
  inputSummary: SimulationResponse['inputSummary'];
  banks: SimulationBankDescriptor[];
}

export type SimulationStreamEvent =
  | { event: 'meta'; data: SimulationStreamMetadata }
  | { event: 'bank-result'; data: { simulationId: string; result: BankSimulationResult } }
  | { event: 'complete'; data: { simulationId: string; completedAt: string; resultsCount: number } }
  | { event: 'error'; data: { code: string; message: string } };

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}
