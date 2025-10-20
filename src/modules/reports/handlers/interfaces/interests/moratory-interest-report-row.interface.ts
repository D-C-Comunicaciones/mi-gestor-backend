export interface InterestReportRow {
  status: string;
  total_generado: number;
  total_recaudado: number;
  total_pendiente: number;
  total_discounted: number;
  total_partially_discounted: number;
  porcentaje_recaudado: number;
  porcentaje_pendiente: number;
}