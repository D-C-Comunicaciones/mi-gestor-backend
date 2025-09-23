import { Controller, Get } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { plainToInstance } from 'class-transformer';
import { ResponseLoantypeDto } from './dto';
import { LoanTypeListResponse } from './interfaces';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiOkResponse, 
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiExtraModels,
  getSchemaPath
} from '@nestjs/swagger';

/**
 * Controlador para la gestión de tipos de crédito
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con los tipos de crédito.
 * Los tipos de crédito son elementos fundamentales para la creación de préstamos,
 * ya que definen las características y reglas de cálculo de cada tipo de producto financiero.
 * 
 * Endpoints principales:
 * - GET /loan-types: Lista todos los tipos de crédito activos
 * - POST /loan-types: Crea un nuevo tipo de crédito (futuro)
 * - GET /loan-types/:id: Obtiene un tipo específico (futuro)
 * - PATCH /loan-types/:id: Actualiza un tipo existente (futuro)
 * - DELETE /loan-types/:id: Desactiva un tipo de crédito (futuro)
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Loan Types')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoantypeDto)
@Controller('loan-types')
export class LoanTypesController {
  constructor(private readonly loanTypesService: LoanTypesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar tipos de crédito', 
    description: 'Obtiene la lista completa de tipos de crédito disponibles para la creación de nuevos préstamos. Los tipos de crédito definen las características del préstamo como método de cálculo de cuotas, frecuencia de pago, etc.' 
  })
  @ApiOkResponse({
    description: 'Lista de tipos de crédito obtenida correctamente',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Listado de tipos de crédito',
          description: 'Mensaje descriptivo del resultado'
        },
        code: { 
          type: 'number', 
          example: 200,
          description: 'Código de estado HTTP'
        },
        status: { 
          type: 'string', 
          example: 'success',
          description: 'Estado de la respuesta'
        },
        data: {
          type: 'object',
          properties: {
            loanTypes: {
              type: 'array',
              description: 'Lista de tipos de crédito disponibles',
              items: {
                type: 'object',
                properties: {
                  id: { 
                    type: 'number', 
                    example: 1,
                    description: 'Identificador único del tipo de crédito'
                  },
                  name: { 
                    type: 'string', 
                    example: 'CUOTA_FIJA',
                    description: 'Nombre del tipo de crédito'
                  },
                  description: { 
                    type: 'string', 
                    example: 'Crédito con cuotas fijas mensuales',
                    description: 'Descripción detallada del tipo de crédito'
                  },
                  isActive: { 
                    type: 'boolean', 
                    example: true,
                    description: 'Indica si el tipo de crédito está activo y disponible'
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No se encontraron tipos de crédito', 
    schema: { 
      example: { 
        message: 'No existen tipos de crédito registrados', 
        code: 404, 
        status: 'error' 
      } 
    } 
  })
  @ApiUnauthorizedResponse({ 
    description: 'Usuario no autenticado',
    schema: {
      example: {
        message: 'Token de acceso requerido',
        code: 401,
        status: 'error'
      }
    }
  })
  @ApiForbiddenResponse({ 
    description: 'Usuario sin permisos suficientes',
    schema: {
      example: {
        message: 'No tiene permisos para acceder a este recurso',
        code: 403,
        status: 'error'
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno del servidor',
    schema: {
      example: {
        message: 'Error interno del servidor',
        code: 500,
        status: 'error'
      }
    }
  })
  async findAll(): Promise<LoanTypeListResponse> {
    const rawLoanTypes = await this.loanTypesService.findAll();
    const loanTypes = plainToInstance(ResponseLoantypeDto, rawLoanTypes, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de tipos de crédito',
      loanTypes
    }
  }

  /**
   * Crea un nuevo tipo de crédito en el sistema
   * 
   * @param createLoanTypeDto Datos del tipo de crédito a crear
   * @returns Promise<LoanTypeResponse> El tipo de crédito creado
   * 
   * @future Implementar cuando sea necesario crear tipos dinámicamente
   */
  // @Post()
  // @ApiOperation({ 
  //   summary: 'Crear tipo de crédito', 
  //   description: 'Crea un nuevo tipo de crédito en el sistema. Los tipos de crédito definen las características y reglas de cálculo para diferentes productos financieros.' 
  // })
  // @ApiBody({ 
  //   type: CreateLoantypeDto,
  //   description: 'Datos requeridos para crear el tipo de crédito',
  //   examples: {
  //     cuotaFija: {
  //       summary: 'Crédito de cuota fija',
  //       value: {
  //         name: 'CUOTA_FIJA',
  //         description: 'Crédito con cuotas fijas mensuales',
  //         isActive: true
  //       }
  //     },
  //     lineaCredito: {
  //       summary: 'Línea de crédito',
  //       value: {
  //         name: 'LINEA_CREDITO',
  //         description: 'Línea de crédito rotativa para capital de trabajo',
  //         isActive: true
  //       }
  //     }
  //   }
  // })
  // @ApiCreatedResponse({ 
  //   description: 'Tipo de crédito creado exitosamente',
  //   type: SwaggerLoanTypeResponse
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'Datos de entrada inválidos o tipo de crédito ya existe',
  //   schema: {
  //     example: {
  //       message: 'Ya existe un tipo de crédito con el nombre: CUOTA_FIJA',
  //       code: 400,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiUnprocessableEntityResponse({ 
  //   description: 'Error de validación en los datos enviados',
  //   schema: {
  //     example: {
  //       message: 'Los datos enviados no son válidos',
  //       errors: ['El nombre es obligatorio', 'El nombre debe estar en mayúsculas'],
  //       code: 422,
  //       status: 'error'
  //     }
  //   }
  // })
  // create(@Body() createLoanTypeDto: CreateLoantypeDto) {
  //   return this.loanTypesService.create(createLoanTypeDto);
  // }

  /**
   * Obtiene un tipo de crédito específico por su ID
   * 
   * @param id Identificador único del tipo de crédito
   * @returns Promise<LoanTypeResponse> El tipo de crédito encontrado
   * 
   * @future Implementar cuando sea necesario consultar tipos individuales
   */
  // @Get(':id')
  // @ApiOperation({ 
  //   summary: 'Obtener tipo de crédito por ID', 
  //   description: 'Obtiene los detalles completos de un tipo de crédito específico mediante su identificador único' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del tipo de crédito',
  //   example: 1
  // })
  // @ApiOkResponse({ 
  //   description: 'Tipo de crédito encontrado exitosamente',
  //   type: SwaggerLoanTypeResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tipo de crédito no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Tipo de crédito con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // findOne(@Param('id') id: string) {
  //   return this.loanTypesService.findOne(+id);
  // }

  /**
   * Actualiza un tipo de crédito existente
   * 
   * @param id Identificador único del tipo de crédito
   * @param updateLoanTypeDto Datos a actualizar
   * @returns Promise<LoanTypeResponse> El tipo de crédito actualizado
   * 
   * @future Implementar cuando sea necesario modificar tipos existentes
   */
  // @Patch(':id')
  // @ApiOperation({ 
  //   summary: 'Actualizar tipo de crédito', 
  //   description: 'Actualiza los datos de un tipo de crédito existente. Solo se actualizan los campos proporcionados (actualización parcial)' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del tipo de crédito a actualizar',
  //   example: 1
  // })
  // @ApiBody({ 
  //   type: UpdateLoantypeDto,
  //   description: 'Datos a actualizar del tipo de crédito',
  //   examples: {
  //     actualizarDescripcion: {
  //       summary: 'Actualizar solo descripción',
  //       value: {
  //         description: 'Nueva descripción del tipo de crédito'
  //       }
  //     },
  //     desactivar: {
  //       summary: 'Desactivar tipo de crédito',
  //       value: {
  //         isActive: false
  //       }
  //     }
  //   }
  // })
  // @ApiOkResponse({ 
  //   description: 'Tipo de crédito actualizado exitosamente',
  //   type: SwaggerLoanTypeResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tipo de crédito no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Tipo de crédito con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'Datos de entrada inválidos',
  //   schema: {
  //     example: {
  //       message: 'No se detectaron cambios para actualizar',
  //       code: 400,
  //       status: 'error'
  //     }
  //   }
  // })
  // update(@Param('id') id: string, @Body() updateLoanTypeDto: UpdateLoantypeDto) {
  //   return this.loanTypesService.update(+id, updateLoanTypeDto);
  // }

  /**
   * Desactiva un tipo de crédito (eliminación lógica)
   * 
   * @param id Identificador único del tipo de crédito
   * @returns Promise<LoanTypeResponse> El tipo de crédito desactivado
   * 
   * @future Implementar cuando sea necesario desactivar tipos
   */
  // @Delete(':id')
  // @ApiOperation({ 
  //   summary: 'Desactivar tipo de crédito', 
  //   description: 'Desactiva un tipo de crédito sin eliminarlo físicamente de la base de datos (soft delete). Los tipos desactivados no aparecerán en las listas de tipos disponibles pero se mantienen por integridad referencial.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del tipo de crédito a desactivar',
  //   example: 1
  // })
  // @ApiOkResponse({ 
  //   description: 'Tipo de crédito desactivado exitosamente',
  //   type: SwaggerLoanTypeResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tipo de crédito no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Tipo de crédito con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'No se puede desactivar el tipo de crédito',
  //   schema: {
  //     example: {
  //       message: 'No se puede desactivar un tipo de crédito que tiene préstamos activos asociados',
  //       code: 400,
  //       status: 'error'
  //     }
  //   }
  // })
  // remove(@Param('id') id: string) {
  //   return this.loanTypesService.remove(+id);
  // }
}
