import { Prisma } from "@prisma/client";

export interface LoanCreationResult {
  termId?: number;
  termValue?: number | null;
  gracePeriodId?: number;
  gracePeriodMonths?: number | null;
  graceEndDate?: Date | null;
}

export interface LoanStrategy {
  validateAndPrepare(
    tx: Prisma.TransactionClient,
    dto: any
  ): Promise<LoanCreationResult>;
}
