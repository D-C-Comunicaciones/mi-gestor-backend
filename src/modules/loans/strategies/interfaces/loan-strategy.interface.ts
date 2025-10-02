import { Prisma } from '@prisma/client';
import { CreateLoanDto } from '../../dto';

export interface LoanCreationData {
  termId?: number;
  termValue?: number | null;
  gracePeriodId?: number;
  gracePeriodMonths?: number | null;
  graceEndDate?: Date | null;
}

export interface LoanStrategy {
  /**
   * Valida los datos específicos del tipo de crédito
   */
  validateDto(dto: CreateLoanDto): Promise<void>;

  /**
   * Prepara los datos específicos para el tipo de crédito
   */
  prepareLoanData(dto: CreateLoanDto, tx: Prisma.TransactionClient): Promise<LoanCreationData>;

  /**
   * Retorna el nombre del tipo de crédito
   */
  getLoanTypeName(): string;
}
