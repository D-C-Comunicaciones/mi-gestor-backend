import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto, UpdateLoanDto, ResponseOverdueLoanDto, LoanPaginationDto } from './dto';
import { PaginationDto } from '@common/dto';
import { LoanByCustomerResponse, LoanListResponse, LoanResponse, RefinanceLoanResponse, OverdueLoansResponse } from './interfaces';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiNotFoundResponse,
  ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiQuery, ApiExtraModels, getSchemaPath,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ResponseLoanDto } from './dto';
import { ResponseLoanWithInstallmentsDto } from './dto/response-loan-by-customer.dto';
import { RefinanceLoanDto } from './dto';
import { NotesService } from '@modules/notes/notes.service';
import { ResponseNoteDto } from '@modules/notes/dto';
import { Request } from 'express';

@ApiTags('Loans')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanDto)
@Controller('loans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
  ) { }

  @Get()
  @Permissions('view.loans')
  @ApiOperation({ summary: 'Listar préstamos', description: 'Retorna lista paginada de préstamos.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
  @ApiOkResponse({
    description: 'Listado obtenido',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Préstamos obtenidos correctamente',
          loans: [
            {
              id: 1,
              amount: 1000000,
              interestRate: 2.5,
              termId: 12,
              customerId: 1,
              status: 'active',
              remainingBalance: 800000,
              totalInterest: 150000,
              isActive: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T14:45:00.000Z'
            },
            {
              id: 2,
              amount: 500000,
              interestRate: 3.0,
              termId: 6,
              customerId: 2,
              status: 'active',
              remainingBalance: 300000,
              totalInterest: 75000,
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
          loans: [],
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
    description: 'Sin permiso view.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los préstamos',
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
          message: 'Error interno del servidor al obtener los préstamos',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(
    @Query() paginationDto: LoanPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoanListResponse> {
    const { loans, meta } = await this.loansService.findAll(paginationDto);
    const arr = Array.isArray(loans) ? loans : [loans];

    if (arr.length === 0) {
      res.status(200);
      return {
        customMessage: 'No existen registros',
        loans: [],
        meta,
      };
    }

    const responseLoans = plainToInstance(ResponseLoanDto, arr, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: 'Préstamos obtenidos correctamente',
      loans: responseLoans,
      meta,
    };
  }

  @Get('overdue')
  @Permissions('view.loans')
  @ApiOperation({
    summary: 'Obtener préstamos en mora',
    description: 'Retorna lista paginada de préstamos que tienen cuotas en mora con información del cliente y detalles de las cuotas vencidas.'
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, description: 'Número de página' } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, description: 'Elementos por página' } })
  @ApiOkResponse({
    description: 'Préstamos en mora obtenidos correctamente',
    examples: {
      'success': {
        summary: 'Préstamos en mora obtenidos exitosamente',
        value: {
          customMessage: 'Préstamos en mora obtenidos correctamente',
          overdueLoans: [
            {
              loanId: 1,
              loanAmount: '1000000.00',
              remainingBalance: '500000.00',
              loanTypeName: 'Cuotas Fijas',
              startDate: '2024-01-01',
              totalDaysLate: 45,
              totalAmountOwed: '250000.00',
              customer: {
                id: 1,
                name: 'Juan Pérez',
                documentNumber: '12345678',
                phone: '+57 300 123 4567',
                address: 'Calle 123 #45-67',
                zoneName: 'Centro',
                zoneCode: 'CTR'
              },
              overdueInstallments: [
                {
                  id: 3,
                  sequence: 3,
                  dueDate: '2024-01-15',
                  daysLate: 45,
                  capitalAmount: '100000.00',
                  interestAmount: '25000.00',
                  totalAmount: '125000.00',
                  paidAmount: '50000.00',
                  pendingAmount: '75000.00',
                  lateFeeAmount: '15000.00',
                  totalOwed: '90000.00',
                  statusName: 'Mora Pagada'
                }
              ]
            }
          ],
          meta: {
            total: 15,
            page: 1,
            lastPage: 2,
            limit: 10,
            hasNextPage: true
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron préstamos en mora',
    examples: {
      'no-overdue-loans': {
        summary: 'No hay préstamos en mora',
        value: {
          customMessage: 'No se encontraron préstamos en mora',
          overdueLoans: [],
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
    description: 'No autenticado',
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
    description: 'Sin permiso view.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los préstamos',
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
          message: 'Error interno del servidor al obtener los préstamos en mora',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async getOverdueLoans(
    @Query() queryDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OverdueLoansResponse> {
    const { overdueLoans, meta } = await this.loansService.getOverdueLoans(queryDto);

    if (overdueLoans.length === 0) {
      return {
        customMessage: 'No se encontraron préstamos en mora',
        overdueLoans: [],
        meta,
      };
    }

    const overdueLoansResponse = plainToInstance(ResponseOverdueLoanDto, overdueLoans, {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Préstamos en mora obtenidos correctamente',
      overdueLoans: overdueLoansResponse,
      meta,
    };
  }

  @Get(':id')
  @Permissions('view.loans')
  @ApiOperation({ summary: 'Obtener préstamo', description: 'Retorna un préstamo por id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Préstamo encontrado',
    examples: {
      'success': {
        summary: 'Préstamo encontrado exitosamente',
        value: {
          customMessage: 'Préstamo obtenido correctamente',
          loan: {
            id: 1,
            amount: 1000000,
            interestRate: 2.5,
            termId: 12,
            customerId: 1,
            status: 'active',
            remainingBalance: 800000,
            totalInterest: 150000,
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z',
            customer: {
              id: 1,
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'juan.perez@ejemplo.com'
            },
            installments: [
              {
                id: 1,
                installmentNumber: 1,
                capitalAmount: 80000,
                interestAmount: 25000,
                totalAmount: 105000,
                dueDate: '2024-02-15',
                isPaid: true,
                paidAt: '2024-02-14T16:30:00.000Z'
              }
            ]
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Préstamo no encontrado',
    examples: {
      'loan-not-found': {
        summary: 'Préstamo no encontrado',
        value: {
          statusCode: 404,
          message: 'Préstamo con ID 1 no encontrado',
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
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso view.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver préstamo',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver este préstamo',
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
          message: 'Error interno del servidor al obtener el préstamo',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LoanResponse> {
    const raw = await this.loansService.findOne(id);
    const [loan] = plainToInstance(ResponseLoanDto, [raw], { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamo obtenido correctamente',
      loan,
    };
  }

  @Post()
  @Permissions('create.loans')
  @ApiOperation({ summary: 'Crear préstamo', description: 'Crea un préstamo (puede generar cuotas).' })
  @ApiBody({
    type: CreateLoanDto,
    description: 'Datos del préstamo a crear',
    examples: {
      'cuotas-fijas': {
        summary: 'Préstamo de cuotas fijas',
        description: 'Ejemplo de préstamo con cuotas fijas mensuales',
        value: {
          customerId: 1,
          loanAmount: '1000000',
          interestRateId: 10,
          termId: 12,
          paymentFrequencyId: 5,
          loanTypeId: 1,
          penaltyRateId: 1
        }
      },
      'solo-intereses': {
        summary: 'Préstamo de solo intereses',
        description: 'Ejemplo de préstamo que paga solo intereses con período de gracia',
        value: {
          customerId: 2,
          loanAmount: '2500000',
          interestRateId: 8,
          termId: 24,
          paymentFrequencyId: 3,
          loanTypeId: 2,
          penaltyRateId: 2,
          gracePeriodId: 1
        }
      },
      'prestamo-semanal': {
        summary: 'Préstamo con pagos semanales',
        description: 'Ejemplo de préstamo con frecuencia de pago semanal',
        value: {
          customerId: 3,
          loanAmount: '500000',
          interestRateId: 12,
          termId: 8,
          paymentFrequencyId: 2,
          loanTypeId: 1,
          penaltyRateId: 1
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Préstamo creado',
    examples: {
      'success': {
        summary: 'Préstamo creado exitosamente',
        value: {
          customMessage: 'Préstamo creado correctamente',
          loan: {
            id: 13,
            customerId: 1,
            loanAmount: '1000000',
            remainingBalance: '1000000',
            interestRateId: 10,
            interestRateValue: '10',
            termId: 12,
            termValue: 12,
            paymentFrequencyId: 5,
            paymentFrequencyName: 'Minute',
            loanTypeId: 1,
            loanTypeName: 'fixed_fees',
            loanStatusId: 1,
            loanStatusName: 'Up to Date',
            startDate: '2025-09-22',
            nextDueDate: '2025-09-22',
            gracePeriodId: null,
            graceEndDate: null,
            graceDaysLeft: null,
            isActive: true,
            createdAt: '2025-09-23 13:37:17',
            updatedAt: '2025-09-23 13:37:18',
            customer: {
              id: 1,
              firstName: 'Juan',
              lastName: 'Pérez',
              email: 'customer@dcmigestor.co',
              typeDocumentIdentificationId: 1,
              typeDocumentIdentificationName: 'Cédula de Ciudadanía',
              typeDocumentIdentificationCode: 'CC',
              documentNumber: 111222333,
              birthDate: '1990-05-13',
              genderId: 1,
              genderName: 'Masculino',
              phone: '3005556666',
              address: 'Calle 100 #50-60',
              zoneId: 2,
              zoneName: 'Centro',
              zoneCode: 'CTR',
              isActive: true,
              createdAt: '',
              updatedAt: ''
            },
            firstInstallment: {
              id: 85,
              loanId: 13,
              sequence: 1,
              dueDate: '2025-09-21',
              capitalAmount: '46763.32',
              interestAmount: '100000',
              totalAmount: '146763.32',
              paidAmount: '0',
              isPaid: false,
              isActive: true,
              statusId: 4,
              paidAt: null,
              createdAt: '2025-09-23 13:37:17',
              updatedAt: '2025-09-23 13:37:17'
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Validación / lógica',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El monto del préstamo debe ser mayor a 0',
            'La tasa de interés debe existir',
            'El cliente debe existir y estar activo'
          ],
          error: 'Bad Request'
        }
      },
      'business-error': {
        summary: 'Error de lógica de negocio',
        value: {
          statusCode: 400,
          message: 'El cliente ya tiene un préstamo activo del mismo tipo',
          error: 'Bad Request'
        }
      },
      'grace-period-error': {
        summary: 'Error de período de gracia',
        value: {
          statusCode: 400,
          message: 'El período de gracia solo se aplica a créditos de tipo "solo intereses"',
          error: 'Bad Request'
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
            'customerId debe ser un número positivo',
            'loanAmount debe ser una cadena numérica válida',
            'interestRateId es requerido',
            'termId debe existir',
            'paymentFrequencyId debe ser válido',
            'loanTypeId debe ser 1 (cuotas fijas) o 2 (solo intereses)',
            'penaltyRateId es requerido'
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
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso create.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para crear préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear préstamos',
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
          message: 'Error interno del servidor al crear el préstamo',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(@Body() dto: CreateLoanDto): Promise<LoanResponse> {
    const result = await this.loansService.create(dto);
    const response = plainToInstance(
      ResponseLoanDto,
      result.loan,
      { excludeExtraneousValues: true },
    );
    return {
      customMessage: 'Préstamo creado correctamente',
      loan: response,
    };
  }

  // @Patch(':id')
  // @Permissions('update.loans')
  // @ApiOperation({ summary: 'Actualizar préstamo', description: 'Actualiza campos cambiados.' })
  // @ApiParam({ name: 'id', type: Number, example: 1 })
  // @ApiBody({
  //   type: UpdateLoanDto,
  //   description: 'Datos del préstamo a actualizar (campos opcionales)',
  //   examples: {
  //     'actualizar-tasa': {
  //       summary: 'Actualizar solo tasa de interés',
  //       description: 'Ejemplo actualizando únicamente la tasa',
  //       value: {
  //         interestRate: 2.8
  //       }
  //     },
  //     'actualizar-completo': {
  //       summary: 'Actualización completa',
  //       description: 'Ejemplo actualizando múltiples campos',
  //       value: {
  //         interestRate: 3.2,
  //         description: 'Préstamo renegociado por situación económica del cliente',
  //         status: 'renegotiated'
  //       }
  //     }
  //   }
  // })
  // @ApiOkResponse({
  //   description: 'Préstamo actualizado',
  //   examples: {
  //     'success': {
  //       summary: 'Préstamo actualizado exitosamente',
  //       value: {
  //         customMessage: 'Préstamo actualizado correctamente',
  //         loan: {
  //           id: 1,
  //           amount: 1000000,
  //           interestRate: 2.8,
  //           termId: 12,
  //           customerId: 1,
  //           status: 'active',
  //           remainingBalance: 800000,
  //           totalInterest: 168000,
  //           updatedAt: '2024-01-20T14:45:00.000Z'
  //         },
  //         changes: [
  //           'interestRate: 2.5 → 2.8'
  //         ]
  //       }
  //     }
  //   }
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'Sin cambios',
  //   examples: {
  //     'no-changes': {
  //       summary: 'No se detectaron cambios',
  //       value: {
  //         statusCode: 400,
  //         message: 'No se detectaron cambios.',
  //         error: 'Bad Request'
  //       }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Préstamo no encontrado',
  //   examples: {
  //     'loan-not-found': {
  //       summary: 'Préstamo no encontrado',
  //       value: {
  //         statusCode: 404,
  //         message: 'Préstamo con ID 1 no encontrado',
  //         error: 'Not Found'
  //       }
  //     }
  //   }
  // })
  // @ApiUnprocessableEntityResponse({
  //   description: 'Errores de validación',
  //   examples: {
  //     'validation-error': {
  //       summary: 'Errores de validación',
  //       value: {
  //         statusCode: 422,
  //         message: [
  //           'interestRate debe estar entre 1 y 50',
  //           'status debe ser un valor válido'
  //         ],
  //         error: 'Unprocessable Entity'
  //       }
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({
  //   description: 'No autenticado',
  //   examples: {
  //     'missing-token': {
  //       summary: 'Token faltante',
  //       value: {
  //         statusCode: 401,
  //         message: 'Token de acceso requerido',
  //         error: 'Unauthorized'
  //       }
  //     }
  //   }
  // })
  // @ApiForbiddenResponse({
  //   description: 'Sin permiso update.loans',
  //   examples: {
  //     'insufficient-permissions': {
  //       summary: 'Sin permisos para actualizar préstamos',
  //       value: {
  //         statusCode: 403,
  //         message: 'No tienes permisos para actualizar préstamos',
  //         error: 'Forbidden'
  //       }
  //     }
  //   }
  // })
  // @ApiInternalServerErrorResponse({
  //   description: 'Error interno del servidor',
  //   examples: {
  //     'server-error': {
  //       summary: 'Error interno del servidor',
  //       value: {
  //         statusCode: 500,
  //         message: 'Error interno del servidor al actualizar el préstamo',
  //         error: 'Internal Server Error'
  //       }
  //     }
  //   }
  // })
  // async update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateLoanDto,
  // ): Promise<LoanUpdateResponse> {
  //   const { updated, changes } = await this.loansService.update(id, dto);
  //   const loan = plainToInstance(ResponseLoanDto, updated, { excludeExtraneousValues: true });
  //   return {
  //     customMessage: 'Préstamo actualizado correctamente',
  //     loan,
  //     changes,
  //   };
  // }

  @Post(':id/refinance')
  @Permissions('refinance.loans')
  @ApiOperation({ summary: 'Refinanciar préstamo', description: 'Refinancia un préstamo inactivo, creando uno nuevo.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: RefinanceLoanDto,
    description: 'Datos para refinanciar el préstamo',
    examples: {
      'refinanciar-basico': {
        summary: 'Refinanciación básica',
        description: 'Ejemplo de refinanciación con nuevos términos',
        value: {
          newAmount: 1200000,
          newInterestRate: 2.2,
          newTermId: 18,
          reason: 'Mejores condiciones por buen historial crediticio'
        }
      },
      'refinanciar-completo': {
        summary: 'Refinanciación completa',
        description: 'Ejemplo de refinanciación con todos los parámetros',
        value: {
          newAmount: 1500000,
          newInterestRate: 2.8,
          newTermId: 24,
          paymentFrequencyId: 2,
          reason: 'Consolidación de deudas y ampliación del plazo',
          startDate: '2024-03-01'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Préstamo refinanciado',
    examples: {
      'success': {
        summary: 'Préstamo refinanciado exitosamente',
        value: {
          customMessage: 'Préstamo refinanciado exitosamente',
          oldLoan: {
            id: 1,
            amount: 1000000,
            status: 'refinanced',
            isActive: false,
            updatedAt: '2024-01-20T14:45:00.000Z'
          },
          newLoan: {
            id: 2,
            amount: 1200000,
            interestRate: 2.2,
            termId: 18,
            customerId: 1,
            status: 'active',
            remainingBalance: 1200000,
            isActive: true,
            createdAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Validación / lógica',
    examples: {
      'cannot-refinance': {
        summary: 'No se puede refinanciar',
        value: {
          statusCode: 400,
          message: 'Solo se pueden refinanciar préstamos inactivos o completamente pagados',
          error: 'Bad Request'
        }
      },
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El nuevo monto debe ser mayor a 0',
            'La nueva tasa debe estar entre 1 y 50'
          ],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Préstamo a refinanciar no encontrado',
    examples: {
      'loan-not-found': {
        summary: 'Préstamo no encontrado',
        value: {
          statusCode: 404,
          message: 'Préstamo con ID 1 no encontrado',
          error: 'Not Found'
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
            'newAmount debe ser un número positivo',
            'newInterestRate es requerido',
            'reason debe ser una cadena de texto'
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
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso refinance.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para refinanciar préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para refinanciar préstamos',
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
          message: 'Error interno del servidor al refinanciar el préstamo',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async refinance(
    @Param('id', ParseIntPipe) loanId: number,
    @Body() dto: RefinanceLoanDto,
  ): Promise<RefinanceLoanResponse> {
    const { oldMapped, newMapped } = await this.loansService.refinance(loanId, dto);
    const oldLoan = plainToInstance(ResponseLoanDto, oldMapped, { excludeExtraneousValues: true });
    const newLoan = plainToInstance(ResponseLoanDto, newMapped, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamo refinanciado exitosamente',
      oldLoan,
      newLoan,
    };
  }

  @Get('customer/:id')
  @Permissions('view.loans')
  @ApiOperation({ summary: 'Obtener préstamos por cliente', description: 'Retorna lista de préstamos de un cliente, con la última cuota.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Préstamos obtenidos correctamente',
    examples: {
      'success': {
        summary: 'Préstamos del cliente obtenidos exitosamente',
        value: {
          customMessage: 'Préstamos obtenidos correctamente',
          loanByCustomer: {
            id: 1,
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@ejemplo.com',
            loans: [
              {
                id: 1,
                amount: 1000000,
                interestRate: 2.5,
                status: 'active',
                remainingBalance: 800000,
                lastInstallment: {
                  id: 12,
                  installmentNumber: 12,
                  capitalAmount: 80000,
                  interestAmount: 25000,
                  totalAmount: 105000,
                  dueDate: '2024-12-15',
                  isPaid: false
                }
              },
              {
                id: 2,
                amount: 500000,
                interestRate: 3.0,
                status: 'paid',
                remainingBalance: 0,
                lastInstallment: {
                  id: 6,
                  installmentNumber: 6,
                  capitalAmount: 85000,
                  interestAmount: 15000,
                  totalAmount: 100000,
                  dueDate: '2023-12-15',
                  isPaid: true,
                  paidAt: '2023-12-14T10:30:00.000Z'
                }
              }
            ]
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Cliente no encontrado',
    examples: {
      'customer-not-found': {
        summary: 'Cliente no encontrado',
        value: {
          statusCode: 404,
          message: 'Cliente con ID 1 no encontrado',
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
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso view.loans',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los préstamos',
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
          message: 'Error interno del servidor al obtener los préstamos del cliente',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async getLoansByCustomer(@Param('id', ParseIntPipe) id: number): Promise<LoanByCustomerResponse> {
    const rawLoansByCustomer = await this.loansService.getLoansByCustomer(id);
    const loanByCustomer = plainToInstance(ResponseLoanWithInstallmentsDto, rawLoansByCustomer, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamos obtenidos correctamente',
      loanByCustomer,
    };
  }

  @Patch(':id/cancel')
  @Permissions('cancel.loans')
  @ApiOperation({ 
    summary: 'Cancelar préstamo', 
    description: 'Cancela un préstamo activo cambiando su estado a cancelado. Esta acción es irreversible y marca el préstamo como inactivo.'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'ID único del préstamo a cancelar', 
    example: 16 
  })
  @ApiOkResponse({
    description: 'Préstamo cancelado exitosamente',
    examples: {
      'success': {
        summary: 'Préstamo cancelado exitosamente',
        value: {
          message: 'Crédito cancelado correctamente',
          loan: {
            id: 16,
            customerId: 1,
            loanAmount: '1000000.00',
            remainingBalance: '500000.00',
            loanStatusId: 6,
            loanStatusName: 'Cancelado',
            isActive: false,
            canceledAt: '2024-01-20T14:45:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z',
            customer: {
              id: 1,
              firstName: 'Juan',
              lastName: 'Pérez',
              documentNumber: '12345678'
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Préstamo no se puede cancelar',
    examples: {
      'already-inactive': {
        summary: 'Préstamo ya inactivo',
        value: {
          statusCode: 400,
          message: 'No se puede cancelar un préstamo que ya está inactivo',
          error: 'Bad Request'
        }
      },
      'already-canceled': {
        summary: 'Préstamo ya cancelado',
        value: {
          statusCode: 400,
          message: 'El préstamo ya se encuentra cancelado',
          error: 'Bad Request'
        }
      },
      'loan-completed': {
        summary: 'Préstamo completamente pagado',
        value: {
          statusCode: 400,
          message: 'No se puede cancelar un préstamo que ya está completamente pagado',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Préstamo no encontrado',
    examples: {
      'loan-not-found': {
        summary: 'Préstamo no encontrado',
        value: {
          statusCode: 404,
          message: 'Préstamo con ID 16 no encontrado',
          error: 'Not Found'
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
    description: 'Acceso prohibido - Sin permisos para cancelar préstamos',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para cancelar préstamos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para cancelar préstamos',
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
          message: 'Error interno del servidor al cancelar el préstamo',
          error: 'Internal Server Error'
        }
      },
      'database-error': {
        summary: 'Error de base de datos',
        value: {
          statusCode: 500,
          message: 'Error de base de datos al actualizar el estado del préstamo',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async cancelLoan(@Param('id', ParseIntPipe) id: number): Promise <LoanResponse>  {
    const rawLoan = await this.loansService.cancelLoan(id);
    const loan = plainToInstance(ResponseLoanDto, rawLoan, { excludeExtraneousValues: true });
    return {
      customMessage: 'Crédito cancelado correctamente',
      loan
    };
  }
}
