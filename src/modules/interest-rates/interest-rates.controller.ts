import { Controller, Get } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { plainToInstance } from 'class-transformer';
import { ResponseInterestRateDto } from './dto';
import { InterestRateListResponse } from './interfaces';
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
 * Controlador para la gestión de tasas de interés corriente
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con las tasas de interés.
 * Las tasas de interés son elementos fundamentales para:
 * - Creación de nuevos préstamos
 * - Procesos de refinanciación de préstamos existentes
 * - Simulaciones de crédito para clientes
 * - Configuración de productos financieros
 * 
 * Las tasas de interés determinan el costo financiero del dinero prestado
 * y varían según el tipo de cliente, producto y condiciones del mercado.
 * 
 * Endpoints principales:
 * - GET /interest-rates: Lista todas las tasas activas
 * - POST /interest-rates: Crea una nueva tasa (futuro)
 * - GET /interest-rates/:id: Obtiene una tasa específica (futuro)
 * - PATCH /interest-rates/:id: Actualiza una tasa existente (futuro)
 * - DELETE /interest-rates/:id: Desactiva una tasa (futuro)
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Interest Rates')
@ApiBearerAuth()
@ApiExtraModels(ResponseInterestRateDto)
@Controller('interest-rates')
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar tasas de interés', 
    description: 'Obtiene la lista completa de tasas de interés disponibles para la creación y refinanciación de préstamos. Las tasas se muestran ordenadas de menor a mayor valor para facilitar la selección por parte de los usuarios finales.' 
  })
  @ApiOkResponse({
    description: 'Lista de tasas de interés obtenida correctamente',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Tasas de interés obtenidas correctamente',
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
            interestRates: {
              type: 'array',
              description: 'Lista de tasas de interés disponibles ordenadas por valor',
              items: {
                type: 'object',
                properties: {
                  id: { 
                    type: 'number', 
                    example: 1,
                    description: 'Identificador único de la tasa de interés'
                  },
                  name: { 
                    type: 'string', 
                    example: '2.5% Mensual',
                    description: 'Nombre descriptivo de la tasa de interés'
                  },
                  value: { 
                    type: 'number', 
                    example: 0.025,
                    description: 'Valor decimal de la tasa de interés'
                  },
                  percentage: { 
                    type: 'string', 
                    example: '2.50%',
                    description: 'Representación porcentual para visualización'
                  },
                  description: { 
                    type: 'string', 
                    example: 'Tasa preferencial para clientes con buen historial crediticio',
                    description: 'Descripción detallada de la tasa y sus condiciones'
                  },
                  isActive: { 
                    type: 'boolean', 
                    example: true,
                    description: 'Indica si la tasa está activa y disponible'
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
    description: 'No se encontraron tasas de interés', 
    schema: { 
      example: { 
        message: 'No se encontraron tasas de interés disponibles', 
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
  async findAll(): Promise<InterestRateListResponse> {
    const rawInterestRates = await this.interestRatesService.findAll();
    const interestRates = plainToInstance(ResponseInterestRateDto, rawInterestRates, { 
      excludeExtraneousValues: true 
    });
    
    return {
      customMessage: 'Tasas de interés obtenidas correctamente',
      interestRates
    };
  }

  // Comentarios para futuros endpoints que podrían implementarse

  // @Post()
  // @ApiOperation({ 
  //   summary: 'Crear tasa de interés', 
  //   description: 'Crea una nueva tasa de interés en el sistema. Solo usuarios con permisos administrativos pueden crear nuevas tasas.' 
  // })
  // @ApiBody({ 
  //   type: CreateInterestRateDto,
  //   description: 'Datos requeridos para crear la tasa de interés',
  //   examples: {
  //     tasaPreferencial: {
  //       summary: 'Tasa preferencial',
  //       value: {
  //         name: '2.0% Mensual Preferencial',
  //         value: 0.02,
  //         description: 'Tasa especial para clientes VIP con excelente historial crediticio',
  //         isActive: true
  //       }
  //     },
  //     tasaEstandar: {
  //       summary: 'Tasa estándar',
  //       value: {
  //         name: '3.5% Mensual Estándar',
  //         value: 0.035,
  //         description: 'Tasa estándar para préstamos comerciales',
  //         isActive: true
  //       }
  //     }
  //   }
  // })
  // @ApiCreatedResponse({ 
  //   description: 'Tasa de interés creada exitosamente',
  //   type: SwaggerInterestRateResponse
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'Datos de entrada inválidos o tasa ya existe',
  //   schema: {
  //     example: {
  //       message: 'Ya existe una tasa con el valor: 0.025',
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
  //       errors: ['El valor debe ser un número entre 0 y 1', 'El nombre es obligatorio'],
  //       code: 422,
  //       status: 'error'
  //     }
  //   }
  // })
  // create(@Body() createInterestRateDto: CreateInterestRateDto) {
  //   return this.interestRatesService.create(createInterestRateDto);
  // }

  // @Get(':id')
  // @ApiOperation({ 
  //   summary: 'Obtener tasa de interés por ID', 
  //   description: 'Obtiene los detalles completos de una tasa de interés específica mediante su identificador único' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único de la tasa de interés',
  //   example: 1
  // })
  // @ApiOkResponse({ 
  //   description: 'Tasa de interés encontrada exitosamente',
  //   type: SwaggerInterestRateResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tasa de interés no encontrada',
  //   schema: {
  //     example: {
  //       message: 'Tasa de interés con ID 999 no encontrada',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // findOne(@Param('id') id: string) {
  //   return this.interestRatesService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ 
  //   summary: 'Actualizar tasa de interés', 
  //   description: 'Actualiza los datos de una tasa de interés existente. Solo se actualizan los campos proporcionados (actualización parcial). Requiere permisos administrativos.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único de la tasa de interés a actualizar',
  //   example: 1
  // })
  // @ApiBody({ 
  //   type: UpdateInterestRateDto,
  //   description: 'Datos a actualizar de la tasa de interés',
  //   examples: {
  //     actualizarTasa: {
  //       summary: 'Cambiar valor de tasa',
  //       value: {
  //         value: 0.03,
  //         name: '3.0% Mensual'
  //       }
  //     },
  //     desactivar: {
  //       summary: 'Desactivar tasa',
  //       value: {
  //         isActive: false
  //       }
  //     }
  //   }
  // })
  // @ApiOkResponse({ 
  //   description: 'Tasa de interés actualizada exitosamente',
  //   type: SwaggerInterestRateResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tasa de interés no encontrada',
  //   schema: {
  //     example: {
  //       message: 'Tasa de interés con ID 999 no encontrada',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'Datos de entrada inválidos o conflicto de unicidad',
  //   schema: {
  //     example: {
  //       message: 'Ya existe una tasa con el valor: 0.025',
  //       code: 400,
  //       status: 'error'
  //     }
  //   }
  // })
  // update(@Param('id') id: string, @Body() updateInterestRateDto: UpdateInterestRateDto) {
  //   return this.interestRatesService.update(+id, updateInterestRateDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ 
  //   summary: 'Desactivar tasa de interés', 
  //   description: 'Desactiva una tasa de interés sin eliminarla físicamente de la base de datos (soft delete). Las tasas desactivadas no aparecerán en las listas de tasas disponibles pero se mantienen por integridad referencial con préstamos existentes.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único de la tasa de interés a desactivar',
  //   example: 1
  // })
  // @ApiOkResponse({ 
  //   description: 'Tasa de interés desactivada exitosamente',
  //   type: SwaggerInterestRateResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Tasa de interés no encontrada',
  //   schema: {
  //     example: {
  //       message: 'Tasa de interés con ID 999 no encontrada',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'No se puede desactivar la tasa de interés',
  //   schema: {
  //     example: {
  //       message: 'No se puede desactivar la tasa de interés. Tiene 15 préstamo(s) activo(s) asociado(s)',
  //       code: 400,
  //       status: 'error'
  //     }
  //   }
  // })
  // remove(@Param('id') id: string) {
  //   return this.interestRatesService.remove(+id);
  // }

  // @Post(':id/calculate')
  // @ApiOperation({
  //   summary: 'Calcular interés mensual',
  //   description: 'Calcula el interés mensual aplicando la tasa especificada a un monto dado. Útil para simulaciones de crédito.'
  // })
  // @ApiParam({
  //   name: 'id',
  //   type: Number,
  //   description: 'ID de la tasa de interés a usar para el cálculo'
  // })
  // @ApiBody({
  //   description: 'Monto sobre el cual calcular el interés',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       amount: {
  //         type: 'number',
  //         description: 'Monto capital sobre el cual calcular el interés',
  //         example: 1000000,
  //         minimum: 0
  //       }
  //     },
  //     required: ['amount']
  //   }
  // })
  // @ApiOkResponse({
  //   description: 'Interés calculado exitosamente',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Interés calculado correctamente' },
  //       data: {
  //         type: 'object',
  //         properties: {
  //           rateId: { type: 'number', example: 1 },
  //           rateName: { type: 'string', example: '2.5% Mensual' },
  //           capitalAmount: { type: 'number', example: 1000000 },
  //           monthlyInterest: { type: 'number', example: 25000 },
  //           percentage: { type: 'string', example: '2.50%' }
  //         }
  //       }
  //     }
  //   }
  // })
  // calculateInterest(@Param('id') id: string, @Body() body: { amount: number }) {
  //   return this.interestRatesService.calculateMonthlyInterest(+id, body.amount);
  // }
}
