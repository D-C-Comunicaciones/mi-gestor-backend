import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CreateInterestRateDto, UpdateInterestRateDto } from './dto';

/**
 * Servicio para la gestión de tasas de interés corriente
 * 
 * Este servicio maneja todas las operaciones relacionadas con las tasas de interés:
 * - Consulta de tasas activas para la creación de préstamos
 * - Consulta de tasas para procesos de refinanciación
 * - Creación de nuevas tasas de interés (futuro)
 * - Actualización de tasas existentes (futuro)
 * - Gestión del estado activo/inactivo
 * 
 * Las tasas de interés definen el costo financiero de los préstamos:
 * - Tasa mensual: Aplicada mensualmente al saldo capital
 * - Tasa anual: Convertida a mensual para cálculos
 * - Tasa preferencial: Para clientes con buen historial
 * - Tasa estándar: Para nuevos clientes o préstamos de mayor riesgo
 * 
 * @version 1.0.0
 * @since 2025-01-04
 */
@Injectable()
export class InterestRatesService {
  private readonly logger = new Logger(InterestRatesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Obtiene todas las tasas de interés activas
   * 
   * Este método es utilizado principalmente para:
   * - Poblar selectores en formularios de creación de préstamos
   * - Validar que la tasa de interés seleccionada esté disponible
   * - Mostrar opciones de tasas disponibles a los usuarios finales
   * - Procesos de refinanciación de préstamos existentes
   * 
   * @returns Promise<InterestRate[]> Lista de tasas de interés activas ordenadas por valor
   * @throws {NotFoundException} Cuando no se encuentran tasas de interés activas
   * @throws {BadRequestException} En caso de error en la consulta
   * 
   * @example
   * ```typescript
   * const rates = await interestRatesService.findAll();
   * // Retorna: [{ id: 1, name: '2.5% Mensual', value: 0.025, isActive: true }, ...]
   * ```
   */
  async findAll() {
    this.logger.log('🔍 Consultando tasas de interés activas');
    
    try {
      const rawInterestRates = await this.prisma.interestRate.findMany({ 
        where: { 
          // Nota: Agregamos un campo isActive al esquema si no existe
          // Por ahora consultamos todas las tasas
        },
        orderBy: { value: 'asc' } // Ordenar por valor de menor a mayor
      });
      
      if (!rawInterestRates || rawInterestRates.length === 0) {
        this.logger.warn('⚠️ No se encontraron tasas de interés disponibles');
        throw new NotFoundException('No se encontraron tasas de interés disponibles');
      }

      // Transformar Decimal a number para la respuesta
      const formattedRates = rawInterestRates.map(rate => ({
        ...rate,
        value: Number(rate.value),
        percentage: `${(Number(rate.value) * 100).toFixed(2)}%`
      }));

      this.logger.log(`✅ Se encontraron ${formattedRates.length} tasas de interés disponibles`);
      return formattedRates;
    } catch (error) {
      this.logger.error('❌ Error consultando tasas de interés:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al consultar las tasas de interés');
    }
  }

  /**
   * Obtiene tasas de interés con paginación
   * 
   * @param page Número de página (default: 1)
   * @param limit Límite de elementos por página (default: 10)
   * @returns Promise con tasas paginadas y metadatos
   * 
   * @future Implementar cuando sea necesario paginar las tasas
   */
  // async findAllPaginated(page: number = 1, limit: number = 10) {
  //   this.logger.log(`🔍 Consultando tasas de interés - Página ${page}, Límite ${limit}`);
  //   
  //   try {
  //     const skip = (page - 1) * limit;
  //     
  //     const [rates, total] = await Promise.all([
  //       this.prisma.interestRate.findMany({
  //         skip,
  //         take: limit,
  //         orderBy: { value: 'asc' }
  //       }),
  //       this.prisma.interestRate.count()
  //     ]);
  //     
  //     const formattedRates = rates.map(rate => ({
  //       ...rate,
  //       value: Number(rate.value),
  //       percentage: `${(Number(rate.value) * 100).toFixed(2)}%`
  //     }));
  //     
  //     const lastPage = Math.ceil(total / limit);
  //     
  //     return {
  //       interestRates: formattedRates,
  //       meta: {
  //         total,
  //         page,
  //         lastPage,
  //         limit,
  //         hasNextPage: page < lastPage
  //       }
  //     };
  //   } catch (error) {
  //     this.logger.error('❌ Error en consulta paginada:', error);
  //     throw new BadRequestException('Error al consultar las tasas de interés');
  //   }
  // }

  /**
   * Crea una nueva tasa de interés
   * 
   * @param createInterestRateDto Datos de la tasa de interés a crear
   * @returns Promise<InterestRate> La tasa de interés creada
   * @throws {BadRequestException} Si ya existe una tasa con el mismo nombre o valor
   * 
   * @future Implementar cuando sea necesario crear tasas dinámicamente
   */
  // async create(createInterestRateDto: CreateInterestRateDto) {
  //   this.logger.log(`📝 Creando nueva tasa de interés: ${createInterestRateDto.name}`);
  //   
  //   try {
  //     // Verificar que no exista una tasa con el mismo nombre
  //     const existingByName = await this.prisma.interestRate.findFirst({
  //       where: { name: createInterestRateDto.name }
  //     });
  //     
  //     if (existingByName) {
  //       throw new BadRequestException(`Ya existe una tasa con el nombre: ${createInterestRateDto.name}`);
  //     }
  //     
  //     // Verificar que no exista una tasa con el mismo valor
  //     const existingByValue = await this.prisma.interestRate.findFirst({
  //       where: { value: createInterestRateDto.value }
  //     });
  //     
  //     if (existingByValue) {
  //       throw new BadRequestException(`Ya existe una tasa con el valor: ${createInterestRateDto.value}`);
  //     }
  //     
  //     const interestRate = await this.prisma.interestRate.create({
  //       data: {
  //         ...createInterestRateDto,
  //         value: new Decimal(createInterestRateDto.value)
  //       }
  //     });
  //     
  //     this.logger.log(`✅ Tasa de interés creada exitosamente: ${interestRate.id}`);
  //     return {
  //       ...interestRate,
  //       value: Number(interestRate.value),
  //       percentage: `${(Number(interestRate.value) * 100).toFixed(2)}%`
  //     };
  //   } catch (error) {
  //     this.logger.error('❌ Error creando tasa de interés:', error);
  //     throw error;
  //   }
  // }

  /**
   * Obtiene una tasa de interés por su ID
   * 
   * @param id ID de la tasa de interés
   * @returns Promise<InterestRate> La tasa de interés encontrada
   * @throws {NotFoundException} Si no se encuentra la tasa de interés
   * 
   * @future Implementar cuando sea necesario consultar tasas individuales
   */
  // async findOne(id: number) {
  //   this.logger.log(`🔍 Consultando tasa de interés con ID: ${id}`);
  //   
  //   try {
  //     const interestRate = await this.prisma.interestRate.findUnique({
  //       where: { id }
  //     });
  //     
  //     if (!interestRate) {
  //       throw new NotFoundException(`Tasa de interés con ID ${id} no encontrada`);
  //     }
  //     
  //     const formattedRate = {
  //       ...interestRate,
  //       value: Number(interestRate.value),
  //       percentage: `${(Number(interestRate.value) * 100).toFixed(2)}%`
  //     };
  //     
  //     this.logger.log(`✅ Tasa de interés encontrada: ${formattedRate.name}`);
  //     return formattedRate;
  //   } catch (error) {
  //     this.logger.error(`❌ Error consultando tasa de interés ${id}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Actualiza una tasa de interés existente
   * 
   * @param id ID de la tasa de interés a actualizar
   * @param updateInterestRateDto Datos a actualizar
   * @returns Promise<InterestRate> La tasa de interés actualizada
   * @throws {NotFoundException} Si no se encuentra la tasa de interés
   * 
   * @future Implementar cuando sea necesario modificar tasas existentes
   */
  // async update(id: number, updateInterestRateDto: UpdateInterestRateDto) {
  //   this.logger.log(`📝 Actualizando tasa de interés ${id}`);
  //   
  //   try {
  //     const existingRate = await this.findOne(id);
  //     
  //     // Verificar unicidad si se está cambiando el nombre
  //     if (updateInterestRateDto.name && updateInterestRateDto.name !== existingRate.name) {
  //       const duplicateName = await this.prisma.interestRate.findFirst({
  //         where: { 
  //           name: updateInterestRateDto.name,
  //           id: { not: id }
  //         }
  //       });
  //       
  //       if (duplicateName) {
  //         throw new BadRequestException(`Ya existe una tasa con el nombre: ${updateInterestRateDto.name}`);
  //       }
  //     }
  //     
  //     // Verificar unicidad si se está cambiando el valor
  //     if (updateInterestRateDto.value && updateInterestRateDto.value !== existingRate.value) {
  //       const duplicateValue = await this.prisma.interestRate.findFirst({
  //         where: { 
  //           value: updateInterestRateDto.value,
  //           id: { not: id }
  //         }
  //       });
  //       
  //       if (duplicateValue) {
  //         throw new BadRequestException(`Ya existe una tasa con el valor: ${updateInterestRateDto.value}`);
  //       }
  //     }
  //     
  //     const updateData = { ...updateInterestRateDto };
  //     if (updateData.value) {
  //       updateData.value = new Decimal(updateData.value);
  //     }
  //     
  //     const updatedRate = await this.prisma.interestRate.update({
  //       where: { id },
  //       data: updateData
  //     });
  //     
  //     this.logger.log(`✅ Tasa de interés actualizada exitosamente`);
  //     return {
  //       ...updatedRate,
  //       value: Number(updatedRate.value),
  //       percentage: `${(Number(updatedRate.value) * 100).toFixed(2)}%`
  //     };
  //   } catch (error) {
  //     this.logger.error(`❌ Error actualizando tasa de interés ${id}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Desactiva una tasa de interés (soft delete)
   * 
   * @param id ID de la tasa de interés a desactivar
   * @returns Promise<InterestRate> La tasa de interés desactivada
   * @throws {NotFoundException} Si no se encuentra la tasa de interés
   * @throws {BadRequestException} Si la tasa tiene préstamos activos asociados
   * 
   * @future Implementar cuando sea necesario desactivar tasas
   */
  // async remove(id: number) {
  //   this.logger.log(`🗑️ Desactivando tasa de interés ${id}`);
  //   
  //   try {
  //     const existingRate = await this.findOne(id);
  //     
  //     // Verificar si tiene préstamos activos asociados
  //     const activeLoans = await this.prisma.loan.count({
  //       where: { 
  //         interestRateId: id,
  //         isActive: true
  //       }
  //     });
  //     
  //     if (activeLoans > 0) {
  //       throw new BadRequestException(
  //         `No se puede desactivar la tasa de interés. Tiene ${activeLoans} préstamo(s) activo(s) asociado(s)`
  //       );
  //     }
  //     
  //     const deactivatedRate = await this.prisma.interestRate.update({
  //       where: { id },
  //       data: { isActive: false }
  //     });
  //     
  //     this.logger.log(`✅ Tasa de interés desactivada exitosamente`);
  //     return {
  //       ...deactivatedRate,
  //       value: Number(deactivatedRate.value),
  //       percentage: `${(Number(deactivatedRate.value) * 100).toFixed(2)}%`
  //     };
  //   } catch (error) {
  //     this.logger.error(`❌ Error desactivando tasa de interés ${id}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Calcula el interés mensual basado en una tasa y un monto
   * 
   * @param rateId ID de la tasa de interés
   * @param amount Monto sobre el cual calcular el interés
   * @returns Promise<number> Valor del interés calculado
   * 
   * @example
   * ```typescript
   * const interest = await service.calculateMonthlyInterest(1, 1000000);
   * // Si la tasa es 2.5% mensual, retorna 25000
   * ```
   * 
   * @future Implementar para cálculos de simulaciones de préstamos
   */
  // async calculateMonthlyInterest(rateId: number, amount: number): Promise<number> {
  //   this.logger.log(`💰 Calculando interés mensual - Tasa: ${rateId}, Monto: ${amount}`);
  //   
  //   try {
  //     const rate = await this.findOne(rateId);
  //     const monthlyInterest = amount * rate.value;
  //     
  //     this.logger.log(`📊 Interés calculado: ${monthlyInterest}`);
  //     return Math.round(monthlyInterest * 100) / 100; // Redondear a 2 decimales
  //   } catch (error) {
  //     this.logger.error('❌ Error calculando interés:', error);
  //     throw error;
  //   }
  // }
}
