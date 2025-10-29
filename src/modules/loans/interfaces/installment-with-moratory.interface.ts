export interface InstallmentWithMoratory {
  installmentId: number;
  sequence: number;
  dueDate: string;
  capitalAmount: string;
  interestAmount: string;
  totalAmount: string;
  paidAmount: string;
  isPaid: boolean;
  moratoryAmount: string;
  daysLate: number;
}