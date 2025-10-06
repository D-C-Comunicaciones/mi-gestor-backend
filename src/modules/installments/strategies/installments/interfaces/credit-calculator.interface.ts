import { Prisma } from "@prisma/client";

export interface CreditCalculator {
  createFirstInstallment(
    tx: Prisma.TransactionClient,
    loan: any,
    options: Record<string, any>
  ): Promise<{ installment: any; remainingInstallments: number | null }>;
}