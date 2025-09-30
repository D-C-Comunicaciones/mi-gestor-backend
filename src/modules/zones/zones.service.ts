import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(createZoneDto: CreateZoneDto) {
    try {
      // Verificar si ya existe una zona con el mismo nombre o código
      const existingZone = await this.prisma.zone.findFirst({
        where: {
          OR: [
            { name: createZoneDto.name },
            { code: createZoneDto.code }
          ]
        }
      });

      if (existingZone) {
        if (existingZone.name === createZoneDto.name) {
          throw new ConflictException('Ya existe una zona con este nombre');
        }
        if (existingZone.code === createZoneDto.code) {
          throw new ConflictException('Ya existe una zona con este código');
        }
      }

      const newZone = await this.prisma.zone.create({
        data: {
          name: createZoneDto.name,
          code: createZoneDto.code.toUpperCase(), // Convertir código a mayúsculas
          isActive: true
        }
      });

      return newZone;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la zona: ' + error.message);
    }
  }

  async findAll() {
    const rawZones = await this.prisma.zone.findMany({ 
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    if (!rawZones || rawZones.length === 0) {
      throw new NotFoundException('No se encontraron zonas activas');
    }

    return rawZones;
  }

  async findOne(id: number) {
    const zone = await this.prisma.zone.findFirst({
      where: { 
        id, 
        isActive: true 
      }
    });

    if (!zone) {
      throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    }

    return zone;
  }

  async update(id: number, updateZoneDto: UpdateZoneDto) {
    // Verificar que la zona existe
    const existingZone = await this.findOne(id);

    // Verificar si hay cambios
    const hasChanges = Object.keys(updateZoneDto).some(key => {
      if (key === 'code') {
        return updateZoneDto[key]?.toUpperCase() !== existingZone[key];
      }
      return updateZoneDto[key] !== existingZone[key];
    });

    if (!hasChanges) {
      throw new BadRequestException('No se detectaron cambios');
    }

    try {
      // Verificar unicidad si se está actualizando nombre o código
      if (updateZoneDto.name || updateZoneDto.code) {
        const conflictZone = await this.prisma.zone.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  ...(updateZoneDto.name ? [{ name: updateZoneDto.name }] : []),
                  ...(updateZoneDto.code ? [{ code: updateZoneDto.code.toUpperCase() }] : [])
                ]
              }
            ]
          }
        });

        if (conflictZone) {
          if (conflictZone.name === updateZoneDto.name) {
            throw new ConflictException('Ya existe una zona con este nombre');
          }
          if (conflictZone.code === updateZoneDto.code?.toUpperCase()) {
            throw new ConflictException('Ya existe una zona con este código');
          }
        }
      }

      const updatedZone = await this.prisma.zone.update({
        where: { id },
        data: {
          ...updateZoneDto,
          code: updateZoneDto.code ? updateZoneDto.code.toUpperCase() : undefined,
        }
      });

      return updatedZone;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la zona: ' + error.message);
    }
  }

}
