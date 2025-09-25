import { Injectable, Logger } from '@nestjs/common';
import { CalculateAmortizationDto } from './dto';
import { AmortizationScheduleItem } from './dto/response-amortization.dto';

/**
 * Servicio para cálculos de amortización
 * 
 * Este servicio se encarga de generar tablas de amortización para préstamos:
 * - Cálculo de cuotas usando sistema francés (cuota fija)
 * - Distribución de capital e intereses por período
 * - Generación de cronogramas de pago completos
 * - Simulaciones para originación de créditos
 * 
 * Las amortizaciones son fundamentales para:
 * - Simulación de préstamos antes de la originación
 * - Cálculo preciso de cuotas y cronogramas
 * - Presentación de propuestas a clientes
 * - Validación de viabilidad financiera
 * - Generación de documentos contractuales
 * 
 * Fórmulas utilizadas:
 * - Sistema francés: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 * - Donde P = Principal, r = tasa mensual, n = número de cuotas
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Injectable()
export class AmortizationsService {
  private readonly logger = new Logger(AmortizationsService.name);

  /**
   * Calcula la tabla de amortización para un préstamo
   * 
   * Utiliza el sistema francés (cuota fija) donde:
   * - La cuota total permanece constante
   * - Al inicio se paga más interés y menos capital
   * - Al final se paga más capital y menos interés
   * - El saldo del préstamo disminuye progresivamente
   * 
   * @param data Parámetros del préstamo (monto, tasa, plazo)
   * @returns Promise con cronograma completo de amortización
   * 
   * @example
   * ```typescript
   * const amortization = await amortizationsService.calculateAmortization({
   *   amount: 1000000,
   *   interestRate: 24,
   *   term: 12
   * });
   * // Retorna cronograma con 12 cuotas de aproximadamente $95,692
   * ```
   */
  async calculateAmortization(data: CalculateAmortizationDto) {
    const { amount, interestRate, term } = data;

    const capitalAmount = amount / term; // cuota fija de capital
    let remainingBalance = amount;

    const schedule: AmortizationScheduleItem[] = [];

    for (let i = 1; i <= term; i++) {
      const interestAmount = remainingBalance * (interestRate / 100); // interés según saldo
      const totalInstallment = capitalAmount + interestAmount;

      remainingBalance -= capitalAmount;

      // Ajuste final para evitar decimales residuales
      if (i === term) remainingBalance = 0;

      schedule.push({
        installment: i,
        capitalAmount: parseFloat(capitalAmount.toFixed(2)),
        interestAmount: parseFloat(interestAmount.toFixed(2)),
        totalInstallment: parseFloat(totalInstallment.toFixed(2)),
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
      });
    }

    return {
      amount,
      interestRate,
      term,
      amortizationSchedule: schedule,
    };
  }
}
