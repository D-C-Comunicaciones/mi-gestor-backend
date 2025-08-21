import {
  Loan,
  Customer,
  PaymentFrequency,
  LoanType,
  LoanStatus,
  Installment,
  Payment,
} from '@prisma/client';

export interface AuditTimestamps {
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface LoanRelations {
  customer?: Customer;
  paymentFrequency?: PaymentFrequency;
  loanType?: LoanType;
  loanStatus?: LoanStatus;
  installments?: Installment[];
  payments?: Payment[];
}

export type LoanExtended = Loan & AuditTimestamps & Partial<LoanRelations>;

export interface LoansMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
  hasNextPage: boolean;
}

export interface LoanChangeRecord {
  field: string;
  old: unknown;
  new: unknown;
}

export interface UpdateResult {
  updated: LoanExtended;
  changes: LoanChangeRecord[];
}
