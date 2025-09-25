import { Controller, Post, Body, Logger } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiOkResponse, 
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
  ApiBody,
  getSchemaPath
} from '@nestjs/swagger';
import { AmortizationsService } from './amortizations.service';
import { AmortizationResponseDto, CalculateAmortizationDto, AmortizationScheduleItem } from './dto';
import { plainToInstance } from 'class-transformer';
import { AmortizationResponse, SwaggerAmortizationResponse } from './interfaces/amortization-response.interface';

/**
 * Controlador para cálculos de amortización
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con el cálculo de tablas
 * de amortización para préstamos. Permite generar cronogramas de pago detallados
 * utilizando el sistema francés (cuota fija).
 * 
 * Funcionalidades principales:
 * - Cálculo de tablas de amortización para simulación
 * - Generación de cronogramas de pago antes de originación
 * - Validación de parámetros de préstamo
 * - Soporte para presentaciones a clientes
 * 
 * Las amortizaciones son fundamentales para:
 * - Simulación de préstamos antes de formalizar
 * - Presentación de opciones de financiamiento
 * - Cálculo preciso de cuotas y distribución
 * - Herramientas de pre-venta y asesoría
 * - Validación de capacidad de pago del cliente
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Amortizations')
@ApiExtraModels(AmortizationResponseDto, AmortizationScheduleItem, SwaggerAmortizationResponse)
@Controller('amortizations')
export class AmortizationsController {
  private readonly logger = new Logger(AmortizationsController.name);

  constructor(private readonly amortizationsService: AmortizationsService) {}

  @Post('calculate')
  @ApiOperation({ 
    summary: 'Calcular tabla de amortización', 
    description: 'Genera un cronograma completo de amortización usando el sistema francés (cuota fija). Incluye el desglose de capital e intereses para cada cuota y el saldo remanente del préstamo.' 
  })
  @ApiBody({
    type: CalculateAmortizationDto,
    description: 'Parámetros del préstamo para calcular la amortización',
    examples: {
      prestamoPersonal: {
        summary: 'Préstamo personal estándar',
        description: 'Ejemplo de préstamo personal a 12 meses',
        value: {
          amount: 1000000,
          interestRate: 24,
          term: 12
        }
      },
      creditoComercial: {
        summary: 'Crédito comercial',
        description: 'Ejemplo de crédito comercial a mayor plazo',
        value: {
          amount: 5000000,
          interestRate: 18,
          term: 24
        }
      },
      microCredito: {
        summary: 'Microcrédito',
        description: 'Ejemplo de microcrédito a corto plazo',
        value: {
          amount: 300000,
          interestRate: 36,
          term: 6
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Tabla de amortización calculada exitosamente',
    type: SwaggerAmortizationResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Amortización calculada con éxito' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            amortizationSchedule: {
              type: 'array',
              description: 'Cronograma detallado de amortización',
              items: { $ref: getSchemaPath(AmortizationScheduleItem) }
            }
          }
        }
      }
    },
    examples: {
      'calculoExitoso': {
        summary: 'Cálculo exitoso de amortización',
        value: {
          customMessage: 'Amortización calculada con éxito',
          amortizationSchedule: [
            {
              installment: 1,
              capitalAmount: 75692.31,
              interestAmount: 20000,
              totalInstallment: 95692.31,
              remainingBalance: 924307.69
            },
            {
              installment: 2,
              capitalAmount: 77206.18,
              interestAmount: 18486.15,
              totalInstallment: 95692.31,
              remainingBalance: 847101.51
            },
            {
              installment: 3,
              capitalAmount: 78750.31,
              interestAmount: 16942.02,
              totalInstallment: 95692.31,
              remainingBalance: 768351.20
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros inválidos para el cálculo',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        montoInvalido: {
          summary: 'Monto inválido',
          value: {
            message: 'El monto debe ser mayor a cero',
            code: 400,
            status: 'error'
          }
        },
        tasaInvalida: {
          summary: 'Tasa de interés inválida',
          value: {
            message: 'La tasa de interés debe estar entre 0.01% y 100%',
            code: 400,
            status: 'error'
          }
        },
        plazoInvalido: {
          summary: 'Plazo inválido',
          value: {
            message: 'El plazo debe ser al menos 1 cuota',
            code: 400,
            status: 'error'
          }
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Error de validación en los datos enviados',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: [
            'El monto debe ser un número válido',
            'La tasa de interés es obligatoria',
            'El plazo debe ser mayor a cero'
          ]
        },
        code: { type: 'number', example: 422 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor durante el cálculo',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor al calcular la amortización' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async calculate(@Body() data: CalculateAmortizationDto): Promise<AmortizationResponse> {
    this.logger.log(`📊 Calculando amortización: monto=${data.amount}, tasa=${data.interestRate}%, plazo=${data.term} cuotas`);
    
    const rawAmortization = await this.amortizationsService.calculateAmortization(data);
    const amortization = plainToInstance(AmortizationResponseDto, rawAmortization);
    
    this.logger.log(`✅ Amortización calculada: ${amortization.amortizationSchedule.length} cuotas generadas`);
    
    return {
      customMessage: 'Amortización calculada con éxito',
      amortizationSchedule: amortization.amortizationSchedule,
    };
  }

  // Comentarios para futuros endpoints que podrían implementarse

  // @Post('compare')
  // @ApiOperation({ 
  //   summary: 'Comparar opciones de amortización', 
  //   description: 'Compara múltiples opciones de préstamo con diferentes tasas y plazos.' 
  // })
  // @ApiBody({
  //   description: 'Lista de opciones a comparar',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       baseAmount: { type: 'number', example: 1000000 },
  //       options: {
  //         type: 'array',
  //         items: {
  //           type: 'object',
  //           properties: {
  //             name: { type: 'string', example: 'Opción A' },
  //             interestRate: { type: 'number', example: 24 },
  //             term: { type: 'number', example: 12 }
  //           }
  //         }
  //       }
  //     }
  //   }
  // })
  // @ApiOkResponse({ description: 'Comparación de opciones generada correctamente' })
  // async compareOptions(@Body() compareDto: any) {
  //   return this.amortizationsService.compareAmortizationOptions(compareDto);
  // }

  // @Get('simulate/:loanTypeId')
  // @ApiOperation({ 
  //   summary: 'Simular amortización por tipo de préstamo', 
  //   description: 'Genera amortización usando parámetros predefinidos de un tipo de préstamo.' 
  // })
  // @ApiParam({ name: 'loanTypeId', type: Number, description: 'ID del tipo de préstamo' })
  // @ApiQuery({ name: 'amount', type: Number, description: 'Monto del préstamo' })
  // @ApiOkResponse({ description: 'Simulación generada correctamente' })
  // async simulateByLoanType(@Param('loanTypeId', ParseIntPipe) loanTypeId: number, @Query('amount', ParseIntPipe) amount: number) {
  //   return this.amortizationsService.simulateByLoanType(loanTypeId, amount);
  // }
}
