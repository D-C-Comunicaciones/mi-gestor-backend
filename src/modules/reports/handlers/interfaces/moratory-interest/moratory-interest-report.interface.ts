import { MoratoryInterestReportItem } from "./moratory-interest-report-item.interface";
import { MoratoryInterestReportSummary } from "./moratory-interest-report-summary.interface";

export interface MoratoryInterestReport {
  headerLogo?: string;               // Imagen superior del PDF (en base64)
  watermarkLogo?: string;            // Marca de agua del PDF (en base64)
  verticalTextBase64?: string;       // Texto vertical en el margen (en base64)
  summaryChartBase64?: string;       // Gráfico de resumen (en base64)
  reportDate: string;                // Fecha del reporte (formato local)
  startDate: string;                 // Fecha de inicio del rango de reporte
  endDate: string;                   // Fecha final del rango de reporte
  summary: MoratoryInterestReportSummary;  // Resumen global de los intereses
  items: MoratoryInterestReportItem[];     // Lista detallada de registros
}