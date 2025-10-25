import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExtraModels } from '@nestjs/swagger';
import { AmortizationsService } from './amortizations.service';
import { AmortizationResponseDto, CalculateAmortizationDto, AmortizationScheduleItem } from './dto';
import { plainToInstance } from 'class-transformer';
import { AmortizationResponse, SwaggerAmortizationResponse } from './interfaces/amortization-response.interface';
import { SwaggerAmortizationDoc } from '@common/decorators/swagger';

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

  constructor(private readonly amortizationsService: AmortizationsService) { }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calcular tabla de amortización',
    description: 'Genera un cronograma completo de amortización usando el sistema francés (cuota fija). Incluye el desglose de capital e intereses para cada cuota y el saldo remanente del préstamo.'
  })
  @SwaggerAmortizationDoc()
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
