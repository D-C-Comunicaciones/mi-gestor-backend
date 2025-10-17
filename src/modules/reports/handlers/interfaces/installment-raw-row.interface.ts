export interface InstallmentRawRow {
  installmentId: number | null;
  loanId: number | null;
  dueDate: string | Date | null;
  totalAmount: string | number | null;
  paidAmount: string | number | null;
  isPaid: boolean | null;
  statusId: number | null;
  sequence: number | null;
  collectorId: number | null;
  collectorName: string | null;
  collectorRoute: string | null;
  collectorRouteId: number | null;
  customerRoute: string | null;
  customerId: number | null;
  customerName: string | null;
}