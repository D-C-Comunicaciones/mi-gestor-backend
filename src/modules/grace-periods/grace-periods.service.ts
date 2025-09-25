import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';

 /**
 * Servicio para la gestión de períodos de gracia
 * 
 * Este servicio maneja todas las operaciones relacionadas con los períodos de gracia:
 * - Consulta de períodos disponibles para créditos mensuales
 * - Validación de períodos de gracia en procesos de originación
 * - Mantenimiento del catálogo de períodos de gracia
 * 
 * Los períodos de gracia son fundamentales para:
 * - Créditos con pagos mensuales de intereses
 * - Flexibilidad en el inicio de pagos de capital
 * - Adaptación a necesidades específicas del cliente
 * - Productos de crédito diferenciados
 * - Manejo de flujo de caja del deudor
 * 
 * Características de los períodos de gracia:
 * - Durante el período solo se pagan intereses (si interestOnly=true)
 * - El capital se empieza a pagar después del período
 * - Se configuran en meses (1, 3, 6, 12, etc.)
 * - Solo aplicables a créditos de tipo mensual
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Injectable()
export class GracePeriodsService {
  private readonly logger = new Logger(GracePeriodsService.name);

  constructor (
    private readonly prisma: PrismaService
  ) {}
//   create(createGracePeriodDto: CreateGracePeriodDto) {
//     return 'This action adds a new gracePeriod';
//   }
// 
  /**
   * Obtiene todos los períodos de gracia activos del sistema
   * 
   * Este método es utilizado principalmente para:
   * - Poblar listas desplegables durante creación de préstamos mensuales
   * - Validar que el período seleccionado sea válido
   * - Mostrar opciones disponibles en interfaces de originación
   * 
   * Solo se muestran para créditos de tipo mensual, ya que los períodos de gracia
   * están diseñados para productos con pagos mensuales de intereses.
   * 
   * @returns Promise<GracePeriod[]> Lista de períodos de gracia activos
   * @throws {NotFoundException} Cuando no se encuentran períodos activos
   * 
   * @example
   * ```typescript
   * const gracePeriods = await gracePeriodsService.findAll();
   * // Retorna: [{ id: 1, name: '3 meses', months: 3 }, { id: 2, name: '6 meses', months: 6 }]
   * ```
   */
  async findAll() {
    const rawGracePeriods = await this.prisma.gracePeriod.findMany( { where: { isActive: true } });

    if(!rawGracePeriods || rawGracePeriods.length===0) throw new Error('No se encontraron periodos de gracia');

    return rawGracePeriods;

  }
// 
//   findOne(id: number) {
//     return `This action returns a #${id} gracePeriod`;
//   }
// 
//   update(id: number, updateGracePeriodDto: UpdateGracePeriodDto) {
//     return `This action updates a #${id} gracePeriod`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} gracePeriod`;
//   }
}
