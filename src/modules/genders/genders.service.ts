import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

/**
 * Servicio para la gestión de géneros
 * 
 * Este servicio maneja todas las operaciones relacionadas con los géneros del sistema:
 * - Consulta de géneros disponibles para formularios de registro
 * - Validación de géneros en procesos de creación de clientes y cobradores
 * - Mantenimiento del catálogo de géneros del sistema
 * 
 * Los géneros son elementos de referencia fundamentales para:
 * - Clasificación demográfica de clientes y cobradores
 * - Formularios de registro y actualización de datos personales
 * - Reportes estadísticos y análisis demográfico
 * - Cumplimiento de normativas de inclusión y diversidad
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Injectable()
export class GendersService {
  private readonly logger = new Logger(GendersService.name);

  constructor(
    private readonly prisma: PrismaService
  ) { }  

  // create(createGenderDto: CreateGenderDto) {
  //   return 'This action adds a new gender';
  // }

  /**
   * Obtiene todos los géneros activos del sistema
   * 
   * Este método es utilizado principalmente para:
   * - Poblar listas desplegables en formularios de registro
   * - Validar que el género seleccionado sea válido
   * - Mostrar opciones disponibles en interfaces de usuario
   * 
   * @returns Promise<Gender[]> Lista de géneros activos
   * @throws {NotFoundException} Cuando no se encuentran géneros activos
   * 
   * @example
   * ```typescript
   * const genders = await gendersService.findAll();
   * // Retorna: [{ id: 1, name: 'Masculino' }, { id: 2, name: 'Femenino' }, ...]
   * ```
   */
  async findAll() {
    const rawGenders = await this.prisma.gender.findMany({ where: { isActive: true } });

    if (!rawGenders || rawGenders.length === 0) {
      throw new Error('No active genders found');
    }

    return rawGenders;
  }

  /**
   * Obtiene un género específico por su ID
   * 
   * @param id ID del género
   * @returns Promise<Gender> El género encontrado
   * @throws {NotFoundException} Si el género no existe
   */
  //   findOne(id: number) {
  //     return `This action returns a #${id} gender`;
  //   }
// 
//   update(id: number, updateGenderDto: UpdateGenderDto) {
//     return `This action updates a #${id} gender`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} gender`;
//   }
}
