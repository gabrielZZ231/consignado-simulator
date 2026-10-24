export interface PriceCalculationInput {
  principal: number;
  monthlyInterestRate: number;
  installments: number;
}

export interface PriceCalculationOutput {
  installmentAmount: number;
  totalAmount: number;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePriceInstallment({
  principal,
  monthlyInterestRate,
  installments
}: PriceCalculationInput): PriceCalculationOutput {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new RangeError('O valor principal deve ser um número positivo.');
  }

  if (!Number.isInteger(installments) || installments <= 0) {
    throw new RangeError('A quantidade de parcelas deve ser um inteiro positivo.');
  }

  if (!Number.isFinite(monthlyInterestRate) || monthlyInterestRate < 0) {
    throw new RangeError('A taxa de juros mensal não pode ser negativa.');
  }

  let rawInstallment: number;

  if (monthlyInterestRate === 0) {
    rawInstallment = principal / installments;
  } else {
    const denominator = 1 - Math.pow(1 + monthlyInterestRate, -installments);
    rawInstallment = (principal * monthlyInterestRate) / denominator;
  }

  const installmentAmount = roundCurrency(rawInstallment);
  const totalAmount = roundCurrency(installmentAmount * installments);

  return {
    installmentAmount,
    totalAmount
  };
}
