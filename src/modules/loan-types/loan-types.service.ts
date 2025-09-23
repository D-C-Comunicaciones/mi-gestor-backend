import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CreateLoantypeDto, UpdateLoantypeDto } from './dto';

/**
 * Servicio para la gestión de tipos de crédito
 * 
 * Este servicio maneja todas las operaciones relacionadas con los tipos de crédito:
 * - Consulta de tipos activos para la creación de préstamos
 * - Creación de nuevos tipos de crédito (futuro)
 * - Actualización de tipos existentes (futuro)
 * - Gestión del estado activo/inactivo
 * 
 * Los tipos de crédito definen las características de los préstamos como:
 * - CUOTA_FIJA: Préstamos con cuotas fijas
 * - INTERES_MENSUAL: Préstamos donde solo se pagan intereses
 * - LINEA_CREDITO: Líneas de crédito rotativas
 */
@Injectable()
export class LoanTypesService {
  private readonly logger = new Logger(LoanTypesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Obtiene todos los tipos de crédito activos
   * 
   * Este método es utilizado principalmente para:
   * - Poblar selectores en formularios de creación de préstamos
   * - Validar que el tipo de crédito seleccionado esté disponible
   * - Mostrar opciones disponibles a los usuarios
   * 
   * @returns Promise<LoanType[]> Lista de tipos de crédito activos
   * @throws {NotFoundException} Cuando no se encuentran tipos de crédito activos
   * 
   * @example
   * ```typescript
   * const loanTypes = await loanTypesService.findAll();
   * // Retorna: [{ id: 1, name: 'CUOTA_FIJA', isActive: true }, ...]
   * ```
   */
  async findAll() {
    this.logger.log('🔍 Consultando tipos de crédito activos');
    
    try {
      const rawLoanTypes = await this.prisma.loanType.findMany({ 
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
      
      if (!rawLoanTypes || rawLoanTypes.length === 0) {
        this.logger.warn('⚠️ No se encontraron tipos de crédito activos');
        throw new NotFoundException('No se encontraron tipos de crédito disponibles');
      }

      this.logger.log(`✅ Se encontraron ${rawLoanTypes.length} tipos de crédito activos`);
      return rawLoanTypes;
    } catch (error) {
      this.logger.error('❌ Error consultando tipos de crédito:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al consultar los tipos de crédito');
    }
  }

  /**
   * Crea un nuevo tipo de crédito
   * 
   * @param createLoanTypeDto Datos del tipo de crédito a crear
   * @returns Promise<LoanType> El tipo de crédito creado
   * @throws {BadRequestException} Si ya existe un tipo con el mismo nombre
   * 
   * @future Este método se implementará cuando sea necesario crear tipos dinámicamente
   */
  // async create(createLoanTypeDto: CreateLoantypeDto) {
  //   this.logger.log(`📝 Creando nuevo tipo de crédito: ${createLoanTypeDto.name}`);
  //   
  //   try {
  //     // Verificar que no exista un tipo con el mismo nombre
  //     const existingType = await this.prisma.loanType.findUnique({
  //       where: { name: createLoanTypeDto.name }
  //     });
  //     
  //     if (existingType) {
  //       throw new BadRequestException(`Ya existe un tipo de crédito con el nombre: ${createLoanTypeDto.name}`);
  //     }
  //     
  //     const loanType = await this.prisma.loanType.create({
  //       data: createLoanTypeDto
  //     });
  //     
  //     this.logger.log(`✅ Tipo de crédito creado exitosamente: ${loanType.id}`);
  //     return loanType;
  //   } catch (error) {
  //     this.logger.error('❌ Error creando tipo de crédito:', error);
  //     throw error;
  //   }
  // }

  /**
   * Obtiene un tipo de crédito por su ID
   * 
   * @param id ID del tipo de crédito
   * @returns Promise<LoanType> El tipo de crédito encontrado
   * @throws {NotFoundException} Si no se encuentra el tipo de crédito
   * 
   * @future Implementar cuando sea necesario consultar tipos individuales
   */
  // async findOne(id: number) {
  //   this.logger.log(`🔍 Consultando tipo de crédito con ID: ${id}`);
  //   
  //   try {
  //     const loanType = await this.prisma.loanType.findUnique({
  //       where: { id }
  //     });
  //     
  //     if (!loanType) {
  //       throw new NotFoundException(`Tipo de crédito con ID ${id} no encontrado`);
  //     }
  //     
  //     this.logger.log(`✅ Tipo de crédito encontrado: ${loanType.name}`);
  //     return loanType;
  //   } catch (error) {
  //     this.logger.error(`❌ Error consultando tipo de crédito ${id}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Actualiza un tipo de crédito existente
   * 
   * @param id ID del tipo de crédito a actualizar
   * @param updateLoanTypeDto Datos a actualizar
   * @returns Promise<LoanType> El tipo de crédito actualizado
   * @throws {NotFoundException} Si no se encuentra el tipo de crédito
   * 
   * @future Implementar cuando sea necesario modificar tipos existentes
   */
  // async update(id: number, updateLoanTypeDto: UpdateLoantypeDto) {
  //   this.logger.log(`📝 Actualizando tipo de crédito ${id}`);
  //   
  //   try {
  //     const existingType = await this.findOne(id);
  //     
  //     const updatedLoanType = await this.prisma.loanType.update({
  //       where: { id },
  //       data: updateLoanTypeDto
  //     });
  //     
  //     this.logger.log(`✅ Tipo de crédito actualizado exitosamente`);
  //     return updatedLoanType;
  //   } catch (error) {
  //     this.logger.error(`❌ Error actualizando tipo de crédito ${id}:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Desactiva un tipo de crédito (soft delete)
   * 
   * @param id ID del tipo de crédito a desactivar
   * @returns Promise<LoanType> El tipo de crédito desactivado
   * @throws {NotFoundException} Si no se encuentra el tipo de crédito
   * 
   * @future Implementar cuando sea necesario desactivar tipos
   */
  // async remove(id: number) {
  //   this.logger.log(`🗑️ Desactivando tipo de crédito ${id}`);
  //   
  //   try {
  //     const existingType = await this.findOne(id);
  //     
  //     const deactivatedLoanType = await this.prisma.loanType.update({
  //       where: { id },
  //       data: { isActive: false }
  //     });
  //     
  //     this.logger.log(`✅ Tipo de crédito desactivado exitosamente`);
  //     return deactivatedLoanType;
  //   } catch (error) {
  //     this.logger.error(`❌ Error desactivando tipo de crédito ${id}:`, error);
  //     throw error;
  //   }
  // }
}
