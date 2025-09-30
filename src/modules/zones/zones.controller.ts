import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneListResponse, ZoneResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseZoneDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiCreatedResponse, ApiParam, ApiBody, ApiUnprocessableEntityResponse, ApiConflictResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('zones')
@ApiBearerAuth()
@Controller('zones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @Permissions('create.zones')
  @ApiOperation({ 
    summary: 'Crear nueva zona',
    description: 'Crea una nueva zona geográfica en el sistema con nombre y código únicos'
  })
  @ApiBody({
    type: CreateZoneDto,
    description: 'Datos de la zona a crear',
    examples: {
      'zona-centro': {
        summary: 'Zona Centro',
        description: 'Ejemplo de zona del centro de la ciudad',
        value: {
          name: 'Centro',
          code: 'CTR'
        }
      },
      'zona-norte': {
        summary: 'Zona Norte',
        description: 'Ejemplo de zona del norte de la ciudad',
        value: {
          name: 'Norte',
          code: 'N'
        }
      },
      'zona-sur-occidente': {
        summary: 'Zona Sur Occidente',
        description: 'Ejemplo de zona más específica',
        value: {
          name: 'Sur Occidente',
          code: 'SO'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Zona creada exitosamente',
    examples: {
      'success': {
        summary: 'Zona creada exitosamente',
        value: {
          customMessage: 'Zona creada correctamente',
          zone: {
            id: 4,
            name: 'Centro',
            code: 'CTR',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El nombre debe ser una cadena de texto',
            'El nombre es requerido',
            'El código debe tener al menos 1 caracter'
          ],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto - Zona ya existe',
    examples: {
      'duplicate-name': {
        summary: 'Nombre duplicado',
        value: {
          statusCode: 409,
          message: 'Ya existe una zona con este nombre',
          error: 'Conflict'
        }
      },
      'duplicate-code': {
        summary: 'Código duplicado',
        value: {
          statusCode: 409,
          message: 'Ya existe una zona con este código',
          error: 'Conflict'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Errores de validación',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'El nombre debe tener al menos 2 caracteres',
            'El código no puede exceder 10 caracteres'
          ],
          error: 'Unprocessable Entity'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Sin permisos para crear zonas',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para crear zonas',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear zonas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al crear la zona',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(@Body() createZoneDto: CreateZoneDto): Promise<ZoneResponse> {
    const rawZone = await this.zonesService.create(createZoneDto);
    const zone = plainToInstance(ResponseZoneDto, rawZone, { excludeExtraneousValues: true });
    return {
      customMessage: 'Zona creada correctamente',
      zone,
    };
  }

  @Get()
  @Permissions('view.zones')
  @ApiOperation({ 
    summary: 'Obtener zonas',
    description: 'Retorna una lista con todas las zonas geográficas disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de zonas obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de zonas',
          zones: [
            {
              id: 1,
              name: 'Norte',
              code: 'N',
              isActive: true,
            },
            {
              id: 2,
              name: 'Sur',
              code: 'S',
              isActive: true,
            },
            {
              id: 3,
              name: 'Centro',
              code: 'C',
              isActive: true,
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Solicitud incorrecta - Parámetros inválidos',
    examples: {
      'invalid-params': {
        summary: 'Parámetros inválidos',
        value: {
          statusCode: 400,
          message: ['El parámetro proporcionado no es válido'],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Permisos insuficientes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para acceder al recurso',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver las zonas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-zones': {
        summary: 'No se encontraron zonas',
        value: {
          statusCode: 404,
          message: 'No se encontraron zonas disponibles',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener las zonas',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<ZoneListResponse> {
    const rawZones = await this.zonesService.findAll();
    const zones = plainToInstance(ResponseZoneDto, rawZones, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de zonas',
      zones,
    };
  }

  @Get(':id')
  @Permissions('view.zones')
  @ApiOperation({ 
    summary: 'Obtener zona por ID',
    description: 'Retorna los detalles de una zona específica por su ID'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la zona',
    example: 1
  })
  @ApiOkResponse({
    description: 'Zona encontrada exitosamente',
    examples: {
      'success': {
        summary: 'Zona encontrada',
        value: {
          customMessage: 'Zona obtenida correctamente',
          zone: {
            id: 1,
            name: 'Centro',
            code: 'CTR',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Zona no encontrada',
    examples: {
      'zone-not-found': {
        summary: 'Zona no encontrada',
        value: {
          statusCode: 404,
          message: 'Zona con ID 1 no encontrada',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permisos para ver zonas',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver las zonas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener la zona',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ZoneResponse> {
    const rawZone = await this.zonesService.findOne(id);
    const zone = plainToInstance(ResponseZoneDto, rawZone, { excludeExtraneousValues: true });
    return {
      customMessage: 'Zona obtenida correctamente',
      zone,
    };
  }

  @Patch(':id')
  @Permissions('update.zones')
  @ApiOperation({ 
    summary: 'Actualizar zona',
    description: 'Actualiza los datos de una zona existente. Solo se actualizan los campos proporcionados'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la zona a actualizar',
    example: 1
  })
  @ApiBody({
    type: UpdateZoneDto,
    description: 'Datos de la zona a actualizar (campos opcionales)',
    examples: {
      'actualizar-nombre': {
        summary: 'Actualizar solo nombre',
        description: 'Ejemplo actualizando únicamente el nombre',
        value: {
          name: 'Centro Histórico'
        }
      },
      'actualizar-codigo': {
        summary: 'Actualizar solo código',
        description: 'Ejemplo actualizando únicamente el código',
        value: {
          code: 'CH'
        }
      },
      'actualizar-completo': {
        summary: 'Actualización completa',
        description: 'Ejemplo actualizando nombre y código',
        value: {
          name: 'Centro Histórico',
          code: 'CH'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Zona actualizada exitosamente',
    examples: {
      'success': {
        summary: 'Zona actualizada exitosamente',
        value: {
          customMessage: 'Zona actualizada correctamente',
          zone: {
            id: 1,
            name: 'Centro Histórico',
            code: 'CH',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o sin cambios',
    examples: {
      'no-changes': {
        summary: 'No se detectaron cambios',
        value: {
          statusCode: 400,
          message: 'No se detectaron cambios',
          error: 'Bad Request'
        }
      },
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El nombre debe tener al menos 2 caracteres',
            'El código no puede exceder 10 caracteres'
          ],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto - Datos duplicados',
    examples: {
      'duplicate-name': {
        summary: 'Nombre ya existe',
        value: {
          statusCode: 409,
          message: 'Ya existe una zona con este nombre',
          error: 'Conflict'
        }
      },
      'duplicate-code': {
        summary: 'Código ya existe',
        value: {
          statusCode: 409,
          message: 'Ya existe una zona con este código',
          error: 'Conflict'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Zona no encontrada',
    examples: {
      'zone-not-found': {
        summary: 'Zona no encontrada',
        value: {
          statusCode: 404,
          message: 'Zona con ID 1 no encontrada',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permisos para actualizar zonas',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para actualizar zonas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al actualizar la zona',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateZoneDto: UpdateZoneDto): Promise<ZoneResponse> {
    const rawZone = await this.zonesService.update(id, updateZoneDto);
    const zone = plainToInstance(ResponseZoneDto, rawZone, { excludeExtraneousValues: true });
    return {
      customMessage: 'Zona actualizada correctamente',
      zone,
    };
  }

}
