import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { PaginationDto } from '@common/dto';
import { ImportListResponse, ImportResponse } from './interfaces';
import { ResponseImportDto } from './dto/response-import.dto';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiParam, ApiQuery, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportsController {
  constructor(
    private readonly importsService: ImportsService,
  ) { }

  /** 📄 Obtiene todas las importaciones ordenadas por fecha descendente */
  @Get('customers')
  @Permissions('view.imports')
  @ApiOperation({ 
    summary: 'Obtener historial de importaciones de clientes',
    description: 'Retorna una lista paginada con todas las importaciones de clientes ordenadas por fecha descendente'
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, description: 'Número de página' } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, description: 'Elementos por página' } })
  @ApiOkResponse({
    description: 'Lista de importaciones obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Historial de importación de clientes',
          customersImports: [
            {
              id: 1,
              fileName: 'clientes_enero_2024.xlsx',
              totalRecords: 150,
              successfulRecords: 148,
              failedRecords: 2,
              status: 'completed',
              startedAt: '2024-01-15T10:30:00.000Z',
              completedAt: '2024-01-15T10:35:00.000Z',
              createdBy: {
                id: 1,
                name: 'Juan Pérez',
                email: 'juan.perez@migestor.com'
              },
              errors: [
                {
                  row: 5,
                  field: 'email',
                  message: 'Email ya existe en el sistema'
                },
                {
                  row: 23,
                  field: 'documentNumber',
                  message: 'Número de documento inválido'
                }
              ]
            },
            {
              id: 2,
              fileName: 'clientes_diciembre_2023.xlsx',
              totalRecords: 85,
              successfulRecords: 85,
              failedRecords: 0,
              status: 'completed',
              startedAt: '2023-12-20T14:15:00.000Z',
              completedAt: '2023-12-20T14:18:00.000Z',
              createdBy: {
                id: 2,
                name: 'María González',
                email: 'maria.gonzalez@migestor.com'
              },
              errors: []
            }
          ],
          meta: {
            total: 25,
            page: 1,
            lastPage: 3,
            limit: 10,
            hasNextPage: true,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron importaciones',
    examples: {
      'no-records': {
        summary: 'No existen registros',
        value: {
          customMessage: 'No existen registros',
          customersImports: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
    examples: {
      'pagination-error': {
        summary: 'Parámetros de paginación inválidos',
        value: {
          statusCode: 400,
          message: [
            'page debe ser un número positivo',
            'limit debe estar entre 1 y 100'
          ],
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
    description: 'Acceso prohibido - Sin permisos para ver importaciones',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver importaciones',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver las importaciones',
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
          message: 'Error interno del servidor al obtener las importaciones',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAllCustomersImports(
    @Query() rolePaginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ImportListResponse> {
    const { Imports, meta } = await this.importsService.findAllCustomersImports(rolePaginationDto);

    if (Imports.length === 0) {
      res.status(404);
      return {
        customMessage: 'No existen registros',
        customersImports: [],
        meta,
      };
    }

    const customersImports = plainToInstance(ResponseImportDto, Imports, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: "Historial de importación de clientes",
      customersImports,
      meta,
    };
  }

  /** 📄 Obtiene una importación específica por ID */
  @Get('customers/:id')
  @Permissions('view.imports')
  @ApiOperation({ 
    summary: 'Obtener importación específica de clientes',
    description: 'Retorna los detalles de una importación específica de clientes por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    example: 1, 
    description: 'ID único de la importación'
  })
  @ApiOkResponse({
    description: 'Importación encontrada exitosamente',
    examples: {
      'success': {
        summary: 'Importación encontrada exitosamente',
        value: {
          customMessage: 'Historial de importación de clientes obtenida',
          customerImport: {
            id: 1,
            fileName: 'clientes_enero_2024.xlsx',
            totalRecords: 150,
            successfulRecords: 148,
            failedRecords: 2,
            status: 'completed',
            startedAt: '2024-01-15T10:30:00.000Z',
            completedAt: '2024-01-15T10:35:00.000Z',
            createdBy: {
              id: 1,
              name: 'Juan Pérez',
              email: 'juan.perez@migestor.com'
            },
            errors: [
              {
                row: 5,
                field: 'email',
                message: 'Email ya existe en el sistema',
                data: {
                  firstName: 'Carlos',
                  lastName: 'López',
                  email: 'juan.perez@ejemplo.com',
                  documentNumber: '12345678'
                }
              },
              {
                row: 23,
                field: 'documentNumber',
                message: 'Número de documento debe tener al menos 6 caracteres',
                data: {
                  firstName: 'Ana',
                  lastName: 'Martínez',
                  email: 'ana.martinez@ejemplo.com',
                  documentNumber: '123'
                }
              }
            ],
            summary: {
              processedInSeconds: 300,
              averageTimePerRecord: 2.0,
              duplicateEmails: 1,
              invalidDocuments: 1,
              successRate: 98.67
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Importación no encontrada',
    examples: {
      'import-not-found': {
        summary: 'Importación no encontrada',
        value: {
          statusCode: 404,
          message: 'Importación con ID 1 no encontrada',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
    examples: {
      'invalid-id': {
        summary: 'ID inválido',
        value: {
          statusCode: 400,
          message: 'El ID debe ser un número válido',
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
    description: 'Acceso prohibido - Sin permisos para ver importaciones',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver importación',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver esta importación',
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
          message: 'Error interno del servidor al obtener la importación',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ImportResponse> {
    const customerImport = await this.importsService.findOne(id);
    return {
      customMessage: "Historial de importación de clientes obtenida",
      customerImport: plainToInstance(ResponseImportDto, customerImport, {
        excludeExtraneousValues: true
      }),
    };
  }
}
