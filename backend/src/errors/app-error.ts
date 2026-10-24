export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class IntegrationTimeoutError extends Error {
  public readonly bankCode: string;
  public readonly timeoutMs: number;

  constructor(bankCode: string, timeoutMs: number) {
    super(`Timeout de ${timeoutMs}ms excedido na integração com ${bankCode}.`);
    this.name = 'IntegrationTimeoutError';
    this.bankCode = bankCode;
    this.timeoutMs = timeoutMs;
  }
}

export class IntegrationUnavailableError extends Error {
  public readonly bankCode: string;

  constructor(bankCode: string, message = 'Falha técnica simulada na comunicação com o banco.') {
    super(message);
    this.name = 'IntegrationUnavailableError';
    this.bankCode = bankCode;
  }
}
