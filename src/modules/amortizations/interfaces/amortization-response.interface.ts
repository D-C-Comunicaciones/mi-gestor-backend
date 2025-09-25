import { ApiProperty } from '@nestjs/swagger';
import { AmortizationScheduleItem } from '../dto';

/**
 * Interfaz base para respuestas del módulo de amortizaciones
 * Define la estructura común de todas las respuestas
 */
export interface BaseAmortizationResponse {
  /** Mensaje personalizado que describe el resultado de la operación */
  customMessage: string;
}

/**
 * Interfaz para la respuesta del cálculo de amortización
 * Utilizada en el endpoint POST /amortizations/calculate
 */
export interface AmortizationResponse extends BaseAmortizationResponse {
  /** Cronograma de amortización calculado */
  amortizationSchedule: AmortizationScheduleItem[];
}

/**
 * Clase documentada para Swagger - Respuesta del cálculo de amortización
 */
export class SwaggerAmortizationResponse {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'Amortización calculada con éxito'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Cronograma completo de amortización del préstamo',
    type: [AmortizationScheduleItem],
    isArray: true,
    example: [
      {
        installment: 1,
        capitalAmount: 75692.31,
        interestAmount: 20000,
        totalInstallment: 95692.31,
        remainingBalance: 924307.69
      },
      {
        installment: 2,
        capitalAmount: 77206.18,
        interestAmount: 18486.15,
        totalInstallment: 95692.31,
        remainingBalance: 847101.51
      }
    ]
  })
  amortizationSchedule: AmortizationScheduleItem[];
}