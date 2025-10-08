import { CreateCollectionDto, ResponseCollectionDto, ResponseCollectionListDto } from '@modules/collections/dto';
import { CreateLoanDto, RefinanceLoanDto } from '@modules/loans/dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiProduces,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse
} from '@nestjs/swagger';

// Decorador para documentar endpoints de exportación de reportes
export function ApiExportReport(options: { reportTypes: string[], formats: string[] }) {
  return applyDecorators(
    ApiOperation({
      summary: 'Exportar reporte',
      description: 'Genera y descarga un reporte dinámicamente según el tipo y formato solicitados.'
    }),
    ApiParam({
      name: 'reportType',
      enum: options.reportTypes,
      description: 'Tipo de reporte a exportar',
      example: options.reportTypes[0]
    }),
    ApiParam({
      name: 'format',
      enum: options.formats,
      description: 'Formato de archivo deseado',
      example: options.formats[0]
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-01-01',
      description: 'Fecha de inicio (YYYY-MM-DD)'
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-12-31',
      description: 'Fecha de fin (YYYY-MM-DD)'
    }),
    ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'),
    ApiOkResponse({
      description: 'Archivo exportado exitosamente',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
        'application/pdf': { schema: { type: 'string', format: 'binary' } },
      }
    }),
    ApiBadRequestResponse({ description: 'Parámetros inválidos' }),
    ApiNotFoundResponse({ description: 'No se encontraron datos para exportar' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token requerido o inválido' }),
    ApiForbiddenResponse({ description: 'Sin permisos para exportar' }),
    ApiInternalServerErrorResponse({ description: 'Error interno al generar el archivo' }),
  );
}

// Decorador para documentar endpoint de creación de cobros
export function SwaggerCreateCollection() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar cobro',
      description:
        'Registra un nuevo cobro en el sistema. Permite registrar pagos de cuotas, intereses o moratorias',
    }),
    ApiBody({
      type: CreateCollectionDto,
      description: 'Datos del cobro a registrar',
      // Aquí puedes poner ejemplos o reutilizar un objeto externo
    }),
    ApiCreatedResponse({
      description: 'Cobro registrado exitosamente',
      type: ResponseCollectionDto,
    }),
    ApiBadRequestResponse({ description: 'Datos inválidos o lógica de negocio' }),
    ApiUnprocessableEntityResponse({ description: 'Errores de validación' }),
    ApiNotFoundResponse({ description: 'Recurso no encontrado' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token inválido o faltante' }),
    ApiForbiddenResponse({ description: 'Sin permisos' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor' }),
  );
}

// Decorador para documentar endpoint de obtención de lista de cobros
export function SwaggerGetCollections() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener historial de cobros',
      description:
        'Retorna una lista paginada con todos los cobros/pagos realizados en el sistema',
    }),
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
    ApiQuery({ name: 'loanId', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'collectorId', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'startDate', required: false, schema: { type: 'string', format: 'date' } }),
    ApiQuery({ name: 'endDate', required: false, schema: { type: 'string', format: 'date' } }),
    ApiOkResponse({ description: 'Lista de cobros obtenida exitosamente', type: ResponseCollectionListDto }),
    ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos' }),
    ApiNotFoundResponse({ description: 'No se encontraron cobros' }),
    ApiUnauthorizedResponse({ description: 'No autorizado - Token inválido o faltante' }),
    ApiForbiddenResponse({ description: 'Sin permisos' }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor' }),
  );
}

// Decorador para documentar endpoint de obtención de lista de préstamos
export function SwaggerListLoans() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar préstamos',
      description: 'Retorna lista paginada de préstamos.',
    }),
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } }),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } }),
    ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } }),
    ApiOkResponse({
      description: 'Listado obtenido',
      examples: {
        success: {
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
                updatedAt: '2024-01-20T14:45:00.000Z',
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
                updatedAt: '2024-01-21T15:45:00.000Z',
              },
            ],
            meta: {
              total: 25,
              page: 1,
              lastPage: 3,
              limit: 10,
              hasNextPage: true,
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
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
              hasNextPage: false,
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: { statusCode: 401, message: 'Token de acceso requerido', error: 'Unauthorized' },
        },
        'invalid-token': {
          summary: 'Token inválido o expirado',
          value: { statusCode: 401, message: 'Token de acceso inválido o expirado', error: 'Unauthorized' },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para ver préstamos',
          value: { statusCode: 403, message: 'No tienes permisos para ver los préstamos', error: 'Forbidden' },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: { statusCode: 500, message: 'Error interno del servidor al obtener los préstamos', error: 'Internal Server Error' },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de obtención de préstamos en mora
export function SwaggerOverdueLoans() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener préstamos en mora',
      description:
        'Retorna lista paginada de préstamos que tienen cuotas en mora con información del cliente.',
    }),
    ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, description: 'Número de página' } }),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, description: 'Elementos por página' } }),
    ApiOkResponse({
      description: 'Préstamos en mora obtenidos correctamente',
      examples: {
        success: {
          summary: 'Préstamos en mora obtenidos exitosamente',
          value: {
            message: 'Préstamos en mora obtenidos correctamente',
            code: 200,
            status: 'success',
            data: {
              overdueLoans: [
                {
                  loanId: 19,
                  loanAmount: '1000000.00',
                  remainingBalance: '1000000.00',
                  loanTypeName: 'Cuotas Fijas',
                  startDate: '2025-10-02',
                  totalDaysLate: 0,
                  totalAmountOwed: '0.00',
                  customer: {
                    id: 3,
                    name: 'armando betancourt',
                    documentNumber: '1234567892',
                    phone: '+573001234567',
                    address: 'en su casa',
                    zoneName: 'Sur',
                    zoneCode: 'SUR',
                  },
                },
              ],
              meta: {
                total: 2,
                page: 1,
                lastPage: 1,
                limit: 10,
                hasNextPage: false,
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron préstamos en mora',
      examples: {
        'no-overdue-loans': {
          summary: 'No hay préstamos en mora',
          value: {
            message: 'No se encontraron préstamos en mora',
            code: 404,
            status: 'error',
            data: {
              overdueLoans: [],
              meta: {
                total: 0,
                page: 1,
                lastPage: 0,
                limit: 10,
                hasNextPage: false,
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Parámetros de consulta inválidos',
      examples: {
        'pagination-error': {
          summary: 'Parámetros de paginación inválidos',
          value: {
            statusCode: 400,
            message: ['page debe ser un número positivo', 'limit debe estar entre 1 y 100'],
            error: 'Bad Request',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para ver préstamos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para ver los préstamos',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al obtener los préstamos en mora',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de obtención de préstamo por ID
export function SwaggerLoanById() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener préstamo',
      description: 'Retorna un préstamo por id.',
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiOkResponse({
      description: 'Préstamo encontrado',
      examples: {
        success: {
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
                email: 'juan.perezejemplo.com',
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
                  paidAt: '2024-02-14T16:30:00.000Z',
                },
              ],
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Préstamo no encontrado',
      examples: {
        'loan-not-found': {
          summary: 'Préstamo no encontrado',
          value: {
            statusCode: 404,
            message: 'Préstamo con ID 1 no encontrado',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para ver préstamo',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para ver este préstamo',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al obtener el préstamo',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de creación de préstamos
export function SwaggerCreateLoan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear préstamo',
      description: 'Crea un préstamo (puede generar cuotas).',
    }),
    ApiBody({
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
            penaltyRateId: 1,
          },
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
            gracePeriodId: 1,
          },
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
            penaltyRateId: 1,
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Préstamo creado',
      examples: {
        success: {
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
                email: 'customerdcmigestor.co',
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
                updatedAt: '',
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
                updatedAt: '2025-09-23 13:37:17',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validación / lógica',
      examples: {
        'validation-error': {
          summary: 'Errores de validación',
          value: {
            statusCode: 400,
            message: [
              'El monto del préstamo debe ser mayor a 0',
              'La tasa de interés debe existir',
              'El cliente debe existir y estar activo',
            ],
            error: 'Bad Request',
          },
        },
        'business-error': {
          summary: 'Error de lógica de negocio',
          value: {
            statusCode: 400,
            message: 'El cliente ya tiene un préstamo activo del mismo tipo',
            error: 'Bad Request',
          },
        },
        'grace-period-error': {
          summary: 'Error de período de gracia',
          value: {
            statusCode: 400,
            message: 'El período de gracia solo se aplica a créditos de tipo "solo intereses"',
            error: 'Bad Request',
          },
        },
      },
    }),
    ApiUnprocessableEntityResponse({
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
              'penaltyRateId es requerido',
            ],
            error: 'Unprocessable Entity',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso create.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para crear préstamos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para crear préstamos',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al crear el préstamo',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de refinanciación de préstamos
export function SwaggerRefinanceLoan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refinanciar préstamo',
      description: 'Refinancia un préstamo inactivo, creando uno nuevo.',
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiBody({
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
            reason: 'Mejores condiciones por buen historial crediticio',
          },
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
            startDate: '2024-03-01',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Préstamo refinanciado',
      examples: {
        success: {
          summary: 'Préstamo refinanciado exitosamente',
          value: {
            message: 'Préstamo refinanciado exitosamente',
            code: 200,
            status: 'success',
            data: {
              oldLoan: {
                id: 1,
                amount: 1000000,
                status: 'refinanced',
                isActive: false,
                updatedAt: '2024-01-20T14:45:00.000Z',
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
                createdAt: '2024-01-20T14:45:00.000Z',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validación / lógica',
      examples: {
        'cannot-refinance': {
          summary: 'No se puede refinanciar',
          value: {
            statusCode: 400,
            message: 'Solo se pueden refinanciar préstamos inactivos o completamente pagados',
            error: 'Bad Request',
          },
        },
        'validation-error': {
          summary: 'Errores de validación',
          value: {
            statusCode: 400,
            message: [
              'El nuevo monto debe ser mayor a 0',
              'La nueva tasa debe estar entre 1 y 50',
            ],
            error: 'Bad Request',
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Préstamo a refinanciar no encontrado',
      examples: {
        'loan-not-found': {
          summary: 'Préstamo no encontrado',
          value: {
            statusCode: 404,
            message: 'Préstamo con ID 1 no encontrado',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Errores de validación',
      examples: {
        'validation-error': {
          summary: 'Errores de validación',
          value: {
            statusCode: 422,
            message: [
              'newAmount debe ser un número positivo',
              'newInterestRate es requerido',
              'reason debe ser una cadena de texto',
            ],
            error: 'Unprocessable Entity',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso refinance.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para refinanciar préstamos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para refinanciar préstamos',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al refinanciar el préstamo',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de obtención de préstamos por ID de cliente
export function SwaggerViewLoanByCustomerId() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener préstamos por cliente',
      description: 'Retorna lista de préstamos de un cliente, con la última cuota.',
    }),
    ApiParam({ name: 'id', type: Number, example: 1 }),
    ApiOkResponse({
      description: 'Préstamos obtenidos correctamente',
      examples: {
        success: {
          summary: 'Préstamos del cliente obtenidos exitosamente',
          value: {
            message: 'Préstamos obtenidos correctamente',
            code: 200,
            status: 'success',
            data: {
              loanByCustomer: {
                id: 1,
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perezejemplo.com',
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
                      isPaid: false,
                    },
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
                      paidAt: '2023-12-14T10:30:00.000Z',
                    },
                  },
                ],
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Cliente no encontrado',
      examples: {
        'customer-not-found': {
          summary: 'Cliente no encontrado',
          value: {
            statusCode: 404,
            message: 'Cliente con ID 1 no encontrado',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.loans',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para ver préstamos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para ver los préstamos',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al obtener los préstamos del cliente',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de cancelación de préstamos
export function SwaggerCancelLoan() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cancelar préstamo',
      description:
        'Cancela un préstamo activo cambiando su estado a cancelado. Esta acción es irreversible y marca el préstamo como inactivo.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID único del préstamo a cancelar',
      example: 16,
    }),
    ApiOkResponse({
      description: 'Préstamo cancelado exitosamente',
      examples: {
        success: {
          summary: 'Préstamo cancelado exitosamente',
          value: {
            message: 'Crédito cancelado correctamente',
            code: 200,
            status: 'success',
            data: {
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
                  documentNumber: '12345678',
                },
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Préstamo no se puede cancelar',
      examples: {
        'already-inactive': {
          summary: 'Préstamo ya inactivo',
          value: {
            statusCode: 400,
            message: 'No se puede cancelar un préstamo que ya está inactivo',
            error: 'Bad Request',
          },
        },
        'already-canceled': {
          summary: 'Préstamo ya cancelado',
          value: {
            statusCode: 400,
            message: 'El préstamo ya se encuentra cancelado',
            error: 'Bad Request',
          },
        },
        'loan-completed': {
          summary: 'Préstamo completamente pagado',
          value: {
            statusCode: 400,
            message: 'No se puede cancelar un préstamo que ya está completamente pagado',
            error: 'Bad Request',
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Préstamo no encontrado',
      examples: {
        'loan-not-found': {
          summary: 'Préstamo no encontrado',
          value: {
            statusCode: 404,
            message: 'Préstamo con ID 16 no encontrado',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado - Token de acceso requerido o inválido',
      examples: {
        'missing-token': {
          summary: 'Token faltante',
          value: {
            statusCode: 401,
            message: 'Token de acceso requerido',
            error: 'Unauthorized',
          },
        },
        'invalid-token': {
          summary: 'Token inválido o expirado',
          value: {
            statusCode: 401,
            message: 'Token de acceso inválido o expirado',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Acceso prohibido - Sin permisos para cancelar préstamos',
      examples: {
        'insufficient-permissions': {
          summary: 'Sin permisos para cancelar préstamos',
          value: {
            statusCode: 403,
            message: 'No tienes permisos para cancelar préstamos',
            error: 'Forbidden',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        'server-error': {
          summary: 'Error interno del servidor',
          value: {
            statusCode: 500,
            message: 'Error interno del servidor al cancelar el préstamo',
            error: 'Internal Server Error',
          },
        },
        'database-error': {
          summary: 'Error de base de datos',
          value: {
            statusCode: 500,
            message: 'Error de base de datos al actualizar el estado del préstamo',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
}

// Decorador para documentar endpoint de obtención de tipos de descuentos
export function SwaggerTypeDiscounts() {
  return applyDecorators(
    ApiOperation({ summary: 'Obtener tipos de descuentos', description: 'Retorna la lista de tipos de descuentos.' }),
    ApiOkResponse({
      description: 'Tipos de descuentos obtenidos correctamente',
      examples: {
        success: {
          summary: 'Tipos de descuentos obtenidos',
          value: {
            message: 'Lista de tipos de descuentos',
            code: 200,
            status: 'success',
            data: {
              typeDiscounts: [
                { id: 1, name: 'Descuento por pronto pago', percentage: 10 },
                { id: 2, name: 'Descuento por volumen', percentage: 15 }
              ]
            }
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autenticado',
      examples: {
        missingToken: {
          summary: 'Token faltante',
          value: {
            code: 401,
            message: 'Token de acceso requerido',
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos',
          value: {
            code: 403,
            message: 'No tiene los permisos necesarios para realizar esta acción.',
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: {
            code: 500,
            message: 'Error interno del servidor',
            status: 'error',
            errors: null
          }
        }
      }
    })
  );
}

// Decorador para documentar endpoint de obtención de reporte de préstamos nuevos y refinanciados
export function SwaggerLoansReport() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener resumen de créditos nuevos y refinanciados',
      description: 'Retorna el valor total y conteo de créditos y refinanciados en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-01-01',
      description: 'Fecha de inicio (Formato YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-12-31',
      description: 'Fecha de fin (Formato YYYY-MM-DD)',
    }),
    ApiOkResponse({
      description: 'Resumen de créditos obtenido correctamente',
      examples: {
        success: {
          summary: 'Resumen de créditos generado exitosamente',
          value: {
            message: 'Resumen de créditos obtenido correctamente',
            code: 200,
            status: 'success',
            data: {
              loansReport: {
                startDate: '2025-09-08',
                endDate: '2025-10-08',
                numberOfNewLoans: 3,
                newLoansTotalAmount: 3000000,
                newLoansDetails: [
                  {
                    id: 19,
                    loanAmount: 1000000,
                    remainingBalance: 1000000,
                    startDate: '2025-10-01',
                    nextDueDate: '2025-10-01',
                    graceEndDate: 'N/A',
                    requiresCapitalPayment: 'No',
                    interestRateId: 15,
                    interestRateName: '15%',
                    interestRateValue: 15,
                    penaltyRateId: 1,
                    penaltyRateName: 'Mora legal máxima',
                    penaltyRateValue: 0.05,
                    termId: 6,
                    termValue: 6,
                    gracePeriodId: null,
                    gracePeriodName: 'N/A',
                    gracePeriodDays: 0,
                    paymentFrequencyId: 5,
                    paymentFrequencyName: 'Minute',
                    loanTypeId: 1,
                    loanTypeName: 'Cuotas Fijas',
                    creditTypeName: 'Cuotas Fijas',
                    loanStatusId: 2,
                    loanStatusName: 'En Mora',
                    customerId: 3,
                    customerName: 'armando betancourt',
                    customerDocument: 1234567892,
                    customerAddress: 'en su casa',
                    customerPhone: '+573001234567'
                  }
                  // ...otros préstamos
                ],
                numberOfRefinancedLoans: 0,
                refinancedLoansTotalAmount: 0,
                refinancedLoansDetails: [],
                summary: {
                  numberOfNewLoans: 3,
                  newLoansTotalAmount: 3000000,
                  numberOfRefinancedLoans: 0,
                  refinancedLoansTotalAmount: 0,
                  totalLoans: 3,
                  totalAmount: 3000000,
                  averageLoanAmount: 1000000
                },
                metadata: {
                  totalRecords: 3,
                  generatedAt: '2025-10-08 17:55:06',
                  period: '2025-09-08 al 2025-10-08'
                }
              }
            }
          }
        }
      }
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron datos de préstamos en el rango de fechas',
      examples: {
        notFound: {
          summary: 'No hay datos en el período',
          value: {
            message: 'No se encontraron datos de préstamos en el rango de fechas proporcionado.',
            code: 404,
            status: 'error',
            errors: null,
            trace: 'NotFoundException: No se encontraron datos de préstamos en el rango de fechas proporcionado.'
          }
        }
      }
    }),
    ApiBadRequestResponse({
      description: 'Parámetros inválidos',
      examples: {
        invalidParams: {
          summary: 'Datos enviados inválidos',
          value: {
            message: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate'],
            code: 400,
            status: 'error',
            errors: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate']
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      examples: {
        missingToken: {
          summary: 'Token faltante',
          value: {
            message: 'Token de acceso requerido',
            code: 401,
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos para ver reportes',
          value: {
            message: 'No tienes permisos para ver los reportes',
            code: 403,
            status: 'error',
            errors: null
          }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: {
            message: 'Error interno del servidor al generar el reporte',
            code: 500,
            status: 'error',
            errors: null
          }
        }
      }
    })
  );
}

// Decorador para documentar endpoint de obtención de reporte de valores de cobros
export function SwaggerCollectionsReport() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener reporte de valores de cobros',
      description: 'Retorna resumen de cobros, colecciones y desempeño de cobradores en un rango de fechas. Si no se especifican fechas, el rango será del último mes.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      example: '2025-11-01',
      description: 'Fecha de inicio (Formato YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      example: '2025-11-11',
      description: 'Fecha de fin (Formato YYYY-MM-DD)',
    }),
    ApiOkResponse({
      description: 'Resumen de valores de cobros obtenido exitosamente',
      examples: {
        success: {
          summary: 'Resumen de cobros generado exitosamente',
          value: {
            message: 'Resumen de valores de cobros obtenido exitosamente',
            code: 200,
            status: 'success',
            data: {
              collectionsReport: {
                startDate: '2025-11-01',
                endDate: '2025-11-11',
                summary: {
                  totalCollections: 0,
                  totalAssigned: 0,
                  totalCollected: 0,
                  totalPending: 0,
                  globalPerformancePercentage: 0,
                  activeCollectors: 0,
                  uniqueCustomers: 0,
                  uniqueLoans: 0,
                  totalInstallmentsInPeriod: 0,
                  totalInstallmentsPaid: 0,
                  totalInstallmentsPending: 0,
                  averageCollectedPerCollector: 0,
                  averageCollectionAmount: 0,
                  bestPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, totalCollectionsMade: 0, route: 'N/A' },
                  worstPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, totalCollectionsMade: 0, route: 'N/A' },
                  leastActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                  bestCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                  worstCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                  mostActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                  chartData: { collectorPerformance: [], collectorComparison: [], collectorActivity: [], globalStats: { assigned: 0, collected: 0, pending: 0, percentage: 0 } }
                },
                collectorSummary: [],
                collections: [],
                metadata: { totalRecords: 0, generatedAt: '2025-10-08', period: '2025-11-01 al 2025-11-11', totalCollectors: 0, activeCollectors: 0 }
              }
            }
          }
        }
      }
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron datos en el rango de fechas',
      examples: {
        notFound: {
          summary: 'No hay datos en el período',
          value: {
            message: 'No se encontraron datos de préstamos en el rango de fechas proporcionado.',
            code: 404,
            status: 'error',
            errors: null,
            trace: 'NotFoundException: No se encontraron datos de préstamos en el rango de fechas proporcionado.'
          }
        }
      }
    }),
    ApiBadRequestResponse({
      description: 'Parámetros inválidos',
      examples: {
        invalidParams: {
          summary: 'Datos enviados inválidos',
          value: {
            message: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate'],
            code: 400,
            status: 'error',
            errors: ['startDate debe tener formato YYYY-MM-DD', 'endDate debe ser posterior a startDate']
          }
        }
      }
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      examples: {
        missingToken: {
          summary: 'Token faltante',
          value: { message: 'Token de acceso requerido', code: 401, status: 'error', errors: null }
        }
      }
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos',
      examples: {
        forbidden: {
          summary: 'Sin permisos para ver reportes',
          value: { message: 'No tienes permisos para ver los reportes', code: 403, status: 'error', errors: null }
        }
      }
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      examples: {
        serverError: {
          summary: 'Error interno',
          value: { message: 'Error interno del servidor al generar el reporte', code: 500, status: 'error', errors: null }
        }
      }
    })
  );
}

// Decorador para documentar endpoint de obtención de lista de cambios en modelos
export function SwaggerChangesList() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar cambios realizados en modelos',
      description: 'Retorna un listado paginado de los cambios realizados en distintos modelos de la aplicación.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Número de página para la paginación',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Cantidad de registros por página',
      example: 5,
    }),
    ApiOkResponse({
      description: 'Lista de cambios obtenida correctamente',
      schema: {
        example: {
          message: 'Lista de cambios realizados en modelos',
          code: 200,
          status: 'success',
          data: {
            changes: [
              {
                id: 1510,
                model: 'Payment',
                action: 'create',
                before: null,
                after: {
                  id: 79,
                  amount: 264237,
                  loanId: 16,
                  collectorId: null,
                  paymentDate: '2025-10-08T00:00:00.000Z',
                  paymentTypeId: 1,
                  paymentMethodId: 1,
                  recordedByUserId: 1,
                },
                timestamp: '2025-10-08 16:08:34',
                userId: 1,
              },
            ],
            meta: {
              total: 79,
              page: 1,
              lastPage: 16,
              limit: 5,
              hasNextPage: true,
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Parámetros de consulta inválidos',
      schema: {
        example: {
          statusCode: 400,
          message: ['page debe ser un número', 'limit debe ser un número'],
          error: 'Bad Request',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'No autorizado',
      schema: {
        example: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Acceso prohibido',
      schema: {
        example: {
          statusCode: 403,
          message: 'No tienes permisos para acceder a los cambios',
          error: 'Forbidden',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'No se encontraron cambios',
      schema: {
        example: {
          statusCode: 404,
          message: 'No se encontraron cambios con los parámetros proporcionados',
          error: 'Not Found',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      schema: {
        example: {
          statusCode: 500,
          message: 'Error al obtener la lista de cambios',
          error: 'Internal Server Error',
        },
      },
    }),
  );
}
