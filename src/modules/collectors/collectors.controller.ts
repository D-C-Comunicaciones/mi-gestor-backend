import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CollectorPaginationDto, CreateCollectorDto, ResponseCollectorDto, UpdateCollectorDto } from './dto';
import { CollectorListResponse, CollectorResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiUnprocessableEntityResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse, ApiParam, ApiQuery, ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiTags('Collectors')
@ApiBearerAuth()
@ApiExtraModels(ResponseCollectorDto)
@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) { }

  @Get()
  @Permissions('view.collectors')
  @ApiOperation({ summary: 'Listar cobradores', description: 'Retorna lista paginada de cobradores.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
  @ApiOkResponse({
    description: 'Listado obtenido',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Cobradores obtenidos correctamente',
          collectors: [
            {
              id: 1,
              firstName: 'Juan',
              lastName: 'Pérez',
              documentNumber: '12345678',
              email: 'juan.perez@cobradores.com',
              phone: '+57 300 123 4567',
              birthDate: '1990-05-15',
              isActive: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T14:45:00.000Z'
            },
            {
              id: 2,
              firstName: 'María',
              lastName: 'García',
              documentNumber: '87654321',
              email: 'maria.garcia@cobradores.com',
              phone: '+57 300 987 6543',
              birthDate: '1985-08-22',
              isActive: true,
              createdAt: '2024-01-16T11:30:00.000Z',
              updatedAt: '2024-01-21T15:45:00.000Z'
            }
          ],
          meta: {
            total: 25,
            page: 1,
            lastPage: 3,
            limit: 10,
            hasNextPage: true
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No existen registros',
    examples: {
      'no-records': {
        summary: 'No se encontraron registros',
        value: {
          customMessage: 'No existen registros',
          collectors: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    description: 'Sin permiso view.collectors',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los cobradores',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener los cobradores',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(
    @Query() collectorPaginationDto: CollectorPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

    if (collectorsArray.length === 0) {
      return {
        customMessage: 'No existen registros',
        collectors: [],
        meta,
      };
    }

    const collectors = plainToInstance(ResponseCollectorDto, collectorsArray, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobradores obtenidos correctamente',
      collectors,
      meta,
    };

  }

  @Get(':id')
  @Permissions('view.collectors')
  @ApiOperation({ summary: 'Obtener cobrador', description: 'Retorna un cobrador por id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Cobrador encontrado',
    examples: {
      'success': {
        summary: 'Cobrador encontrado exitosamente',
        value: {
          customMessage: 'Cobrador obtenido correctamente',
          collector: {
            id: 1,
            firstName: 'Juan',
            lastName: 'Pérez',
            documentNumber: '12345678',
            email: 'juan.perez@cobradores.com',
            phone: '+57 300 123 4567',
            birthDate: '1990-05-15',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Cobrador no encontrado',
    examples: {
      'collector-not-found': {
        summary: 'Cobrador no encontrado',
        value: {
          statusCode: 404,
          message: 'Cobrador con ID 1 no encontrado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    description: 'Sin permiso view.collectors',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver cobrador',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver este cobrador',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.findOne(id);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador obtenido correctamente',
      collector,
    };

  }

  @Post()
  @Permissions('create.collectors')
  @ApiOperation({ summary: 'Crear cobrador', description: 'Crea un nuevo cobrador y su usuario asociado.' })
  @ApiBody({
    type: CreateCollectorDto,
    description: 'Datos del cobrador a crear',
    examples: {
      'cobrador-basico': {
        summary: 'Cobrador básico',
        description: 'Ejemplo de cobrador con información completa',
        value: {
          firstName: 'Juan',
          lastName: 'Pérez',
          typeDocumentIdentificationId: 1,
          documentNumber: 1234567890,
          birthDate: '2005-05-15',
          genderId: 1,
          phone: '+573001234567',
          email: 'cobrador111@migestor.com',
          address: 'test etes',
          zoneId: 2
        }
      },
      'cobrador-completo': {
        summary: 'Cobrador completo',
        description: 'Ejemplo de cobrador con otra zona y datos diferentes',
        value: {
          firstName: 'Ana Lucía',
          lastName: 'Martínez López',
          typeDocumentIdentificationId: 1,
          documentNumber: 45678901,
          birthDate: '1992-07-25',
          genderId: 2,
          phone: '+57 300 777 8899',
          email: 'ana.martinez@migestor.com',
          address: 'Calle 123 #45-67',
          zoneId: 1
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Cobrador creado',
    examples: {
      'success': {
        summary: 'Cobrador creado exitosamente',
        value: {
          customMessage: 'Cobrador creado correctamente',
          collector: {
            id: 3,
            firstName: 'Juan',
            lastName: 'Pérez',
            typeDocumentIdentificationId: 1,
            documentNumber: 1234567890,
            birthDate: '2005-05-14',
            genderId: 1,
            phone: '+573001234567',
            address: 'test etes',
            zoneId: 2,
            userId: 5,
            zone: {
              id: 2,
              name: 'Centro',
              code: 'CTR'
            },
            user: {
              id: 5,
              email: 'cobrador111@migestor.com',
              name: 'Juan Pérez'
            },
            createdAt: '2025-09-23 14:30:35',
            updatedAt: '2025-09-23 14:30:35'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Violación de unicidad o datos inválidos',
    examples: {
      'duplicate-document': {
        summary: 'Documento ya registrado',
        value: {
          statusCode: 400,
          message: 'El número de documento ya está registrado.',
          error: 'Bad Request'
        }
      },
      'duplicate-email': {
        summary: 'Email ya registrado',
        value: {
          statusCode: 400,
          message: 'El email ya está registrado en el sistema.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Error de validación',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'firstName no debe estar vacío',
            'email debe ser un email válido',
            'documentNumber debe tener al menos 6 caracteres',
            'birthDate debe ser una fecha válida'
          ],
          error: 'Unprocessable Entity'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    description: 'Sin permiso create.collectors',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para crear cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear cobradores',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al crear el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(
    @Body() data: CreateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.create(data);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador creado correctamente',
      collector,
    };

  }

  @Patch(':id')
  @Permissions('update.collectors')
  @ApiOperation({ summary: 'Actualizar cobrador', description: 'Actualiza campos del cobrador (solo cambios detectados).' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: UpdateCollectorDto,
    description: 'Datos del cobrador a actualizar (campos opcionales)',
    examples: {
      'actualizar-email': {
        summary: 'Actualizar solo email',
        description: 'Ejemplo actualizando únicamente el email',
        value: {
          email: 'nuevo.email@cobradores.com'
        }
      },
      'actualizar-completo': {
        summary: 'Actualización completa',
        description: 'Ejemplo actualizando múltiples campos',
        value: {
          firstName: 'Carlos Alberto',
          lastName: 'Rodríguez Actualizado',
          email: 'carlos.actualizado@cobradores.com',
          phone: '+57 300 999 8888',
          address: 'Nueva dirección 456 #78-90'
        }
      },
      'cambiar-estado': {
        summary: 'Cambiar estado',
        description: 'Ejemplo desactivando el cobrador',
        value: {
          isActive: false
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Actualizado',
    examples: {
      'success': {
        summary: 'Cobrador actualizado exitosamente',
        value: {
          customMessage: 'Cobrador actualizado correctamente',
          collector: {
            id: 1,
            firstName: 'Carlos Alberto',
            lastName: 'Rodríguez Actualizado',
            documentNumber: '98765432',
            email: 'carlos.actualizado@cobradores.com',
            phone: '+57 300 999 8888',
            birthDate: '1988-03-10',
            isActive: true,
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Sin cambios o unicidad',
    examples: {
      'no-changes': {
        summary: 'No se detectaron cambios',
        value: {
          statusCode: 400,
          message: 'No se detectaron cambios.',
          error: 'Bad Request'
        }
      },
      'duplicate-email': {
        summary: 'Email ya existe',
        value: {
          statusCode: 400,
          message: 'El email ya está registrado por otro cobrador.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No existe',
    examples: {
      'collector-not-found': {
        summary: 'Cobrador no encontrado',
        value: {
          statusCode: 404,
          message: 'Cobrador con ID 1 no encontrado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Validación fallida',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'email debe ser un email válido',
            'phone debe tener un formato válido'
          ],
          error: 'Unprocessable Entity'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    description: 'Sin permiso update.collectors',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para actualizar cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para actualizar cobradores',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al actualizar el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.update(id, dto);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Cobrador actualizado correctamente',
      collector,
    };
  }

}
