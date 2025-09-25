import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ResponseConfigurationDto } from './dto';
import { format } from 'date-fns';

/**
 * Servicio para la gestión de configuraciones del sistema
 * 
 * Este servicio maneja todas las operaciones relacionadas con la configuración global:
 * - Configuración de moneda predeterminada del sistema
 * - Configuración de zona horaria para fechas y reportes
 * - Personalización de paleta de colores de la interfaz
 * - Parámetros generales de funcionamiento del sistema
 * 
 * Las configuraciones son fundamentales para:
 * - Localización del sistema según el país/región
 * - Uniformidad en formato de moneda y fechas
 * - Personalización de marca e interfaz
 * - Adaptación a normativas locales
 * - Experiencia de usuario consistente
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */
@Injectable()
export class ConfigurationsService {
  private readonly logger = new Logger(ConfigurationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva configuración del sistema
   * 
   * @param data Datos de la configuración a crear
   * @returns Promise<Configuration> La configuración creada
   */
  async create(createConfigurationDto: CreateConfigurationDto): Promise<ResponseConfigurationDto> {
    const conf = await this.prisma.configuration.create({
      include: {
        timezone: true,
        currency: true,
      },
      data: createConfigurationDto,
    });
    const rawConf = this.mapConfigurationToDto(conf);
    return rawConf;
  }

  /**
   * Obtiene todas las configuraciones del sistema
   * 
   * @returns Promise<Configuration[]> Lista de configuraciones
   */
  async findAll(){
    const confs = await this.prisma.configuration.findMany({
      include: {
        timezone: true,
        currency: true,
      },
    });
    const rawConf = confs.map((conf) => this.mapConfigurationToDto(conf));
    return rawConf;
  }

  /**
   * Obtiene una configuración específica por su ID
   * 
   * @param id ID de la configuración
   * @returns Promise<Configuration> La configuración encontrada
   * @throws {NotFoundException} Si la configuración no existe
   */
  async findOne(id: number){
    const conf = await this.prisma.configuration.findUnique({
      where: { id },
      include: {
        timezone: true,
        currency: true,
      },
    });
    const rawConf = conf ? this.mapConfigurationToDto(conf) : null;
    if (!rawConf) {
      throw new NotFoundException(`Configuración no encontrada con ID: ${id}`);
    }
    return rawConf;
  }

  /**
   * Actualiza una configuración existente
   * 
   * @param id ID de la configuración a actualizar
   * @param data Datos a actualizar
   * @returns Promise<Configuration> La configuración actualizada
   * @throws {NotFoundException} Si la configuración no existe
   */
  async update(id: number, updateConfigurationDto: UpdateConfigurationDto){
    const conf = await this.prisma.configuration.update({
      where: { id },
      include: {
        timezone: true,
        currency: true,
      },
      data: updateConfigurationDto,
    });
    const rawConf = this.mapConfigurationToDto(conf);
    return rawConf;
  }

  private mapConfigurationToDto(conf: any){
    const rawConf = {
      id: conf.id,
      currencyId: conf.currencyId,
      currencyName: conf.currency?.name || null,
      currencyCode: conf.currency?.code || null,
      currencySymbol: conf.currency?.symbol || null,
      timezoneId: conf.timezoneId,
      timeZoneName: conf.timezone?.name || null,
      timeZoneOffset: conf.timezone?.offset || null,
      colorPalette: conf.colorPalette,
      createdAt: conf.createdAt,
      updatedAt: conf.updatedAt,
    };

    return rawConf;
  }
}
