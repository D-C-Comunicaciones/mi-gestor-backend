import { Decimal } from "@prisma/client/runtime/library";

export interface MoratoryInterestReportItem {
  id: number;
  installmentId: number;
  loanCode: string;                  // Código o referencia del préstamo
  customerName: string;              // Nombre del cliente
  daysLate: number;
  amount: Decimal | number;          // Monto generado
  paidAmount: Decimal | number;      // Monto pagado
  balance: Decimal | number;         // Diferencia (pendiente)
  isPaid: boolean;
  isDiscounted: boolean;
  paidAt?: Date | null;
  moratoryInterestStatus: string;    // Estado ("Unpaid", "Paid", etc.)
  createdAt: Date;
  updatedAt: Date;
}