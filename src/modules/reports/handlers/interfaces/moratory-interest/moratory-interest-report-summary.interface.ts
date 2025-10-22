import { Decimal } from "@prisma/client/runtime/library";

export interface MoratoryInterestReportSummary {
  totalGenerated: Decimal | number;  // Total de intereses generados
  totalPaid: Decimal | number;       // Total pagado
  totalPending: Decimal | number;    // Total pendiente
  totalDiscounted: Decimal | number; // Total descontado
  countRecords: number;              // Número total de registros
}