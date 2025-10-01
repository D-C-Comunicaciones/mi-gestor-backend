import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Query, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerPaginationDto, CreateCustomerDto, UpdateCustomerDto, ResponseCustomerDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { CustomerDetailResponse, CustomerListResponse, CustomerResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiUnprocessableEntityResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse, ApiParam, ApiQuery, ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ResponseLoanDto } from '@modules/loans/dto';
import { UserResponseDto } from '@modules/users/dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Customers')
@ApiBearerAuth()
@ApiExtraModels(ResponseCustomerDto)
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    @Permissions('view.customers')
    @ApiOperation({ summary: 'Listar clientes', description: 'Retorna lista paginada de clientes.' })
    @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
    @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
    @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
    @ApiOkResponse({
        description: 'Listado obtenido',
        examples: {
            'success': {
                summary: 'Lista obtenida exitosamente',
                value: {
                    customMessage: 'Clientes obtenidos correctamente',
                    customers: [
                        {
                            id: 1,
                            firstName: 'Juan',
                            lastName: 'Pérez',
                            documentNumber: '12345678',
                            email: 'juan.perez@ejemplo.com',
                            phone: '+57 300 123 4567',
                            isActive: true,
                            createdAt: '2024-01-15T10:30:00.000Z',
                            updatedAt: '2024-01-20T14:45:00.000Z'
                        },
                        {
                            id: 2,
                            firstName: 'María',
                            lastName: 'García',
                            documentNumber: '87654321',
                            email: 'maria.garcia@ejemplo.com',
                            phone: '+57 300 987 6543',
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
                    customers: [],
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
        description: 'Sin permiso view.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para ver clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para ver los clientes',
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
                    message: 'Error interno del servidor al obtener los clientes',
                    error: 'Internal Server Error'
                }
            }
        }
    })
    async findAll(
        @Query() paginationDto: CustomerPaginationDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<CustomerListResponse> {
        const { customers, meta } = await this.customersService.findAll(paginationDto);

        if (customers.length === 0) {
            return {
                customMessage: 'No existen registros',
                customers: [],
                meta,
            };
        }

        // Asegúrate de que ResponseCustomerDto tenga la propiedad email
        const customersResponse = plainToInstance(ResponseCustomerDto, customers, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
        });

        return {
            customMessage: 'Clientes obtenidos correctamente',
            customers: customersResponse,
            meta,
        };
    }

    @Get(':id')
    @Permissions('view.customers')
    @ApiOperation({ summary: 'Obtener cliente', description: 'Retorna un cliente por id.' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiOkResponse({
        description: 'Cliente encontrado',
        examples: {
            'success': {
                summary: 'Cliente encontrado exitosamente',
                value: {
                    customMessage: 'Cliente obtenido correctamente',
                    customer: {
                        id: 1,
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        documentNumber: '12345678',
                        email: 'juan.perez@ejemplo.com',
                        phone: '+57 300 123 4567',
                        isActive: true,
                        createdAt: '2024-01-15T10:30:00.000Z',
                        updatedAt: '2024-01-20T14:45:00.000Z'
                    },
                    loans: [
                        {
                            id: 1,
                            amount: 1000000,
                            interestRate: 2.5,
                            status: 'active',
                            createdAt: '2024-01-15T10:30:00.000Z'
                        }
                    ],
                    user: {
                        id: 1,
                        email: 'juan.perez@ejemplo.com',
                        name: 'Juan Pérez',
                        isActive: true
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
        description: 'Sin permiso view.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para ver cliente',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para ver este cliente',
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
                    message: 'Error interno del servidor al obtener el cliente',
                    error: 'Internal Server Error'
                }
            }
        }
    })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<CustomerDetailResponse> {
        const { customer, loans, user } = await this.customersService.findOne(id);

        const responseCustomer = plainToInstance(ResponseCustomerDto, customer, {
            excludeExtraneousValues: true,
        });

        const responseLoans = plainToInstance(ResponseLoanDto, loans, {
            excludeExtraneousValues: true,
        });

        const responseUser = user
            ? plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
            : null;

        return {
            customMessage: 'Cliente obtenido correctamente',
            customer: responseCustomer,
            loans: responseLoans,
            user: responseUser,
        };
    }
    @Post()
    @Permissions('create.customers')
    @ApiOperation({ summary: 'Crear cliente', description: 'Crea un cliente y su usuario.' })
    @ApiBody({
        type: CreateCustomerDto,
        description: 'Datos del cliente a crear',
        examples: {
            'cliente-basico': {
                summary: 'Cliente básico',
                description: 'Ejemplo de cliente con información completa',
                value: {
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    typeDocumentIdentificationId: 1,
                    documentNumber: 1234567890000,
                    birthDate: '2005-05-15',
                    genderId: 1,
                    phone: '+573001234567',
                    email: 'cobrador1@migestor.com',
                    address: 'test etes',
                    zoneId: 2
                }
            },
            'cliente-completo': {
                summary: 'Cliente completo',
                description: 'Ejemplo de cliente con otra zona y datos diferentes',
                value: {
                    firstName: 'María Fernanda',
                    lastName: 'González López',
                    typeDocumentIdentificationId: 1,
                    documentNumber: 987654321000,
                    birthDate: '1990-08-22',
                    genderId: 2,
                    phone: '+57 300 987 6543',
                    email: 'maria.gonzalez@ejemplo.com',
                    address: 'Calle 123 #45-67',
                    zoneId: 1
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'Cliente creado',
        examples: {
            'success': {
                summary: 'Cliente creado exitosamente',
                value: {
                    customMessage: 'Cliente creado correctamente',
                    customer: {
                        id: 3,
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        email: 'cobrador1@migestor.com',
                        typeDocumentIdentificationId: 1,
                        typeDocumentIdentificationName: 'Cédula de Ciudadanía',
                        typeDocumentIdentificationCode: 'CC',
                        documentNumber: 1234567890,
                        birthDate: '2005-05-13',
                        genderId: 1,
                        genderName: 'Masculino',
                        zoneId: 2,
                        zoneName: 'Centro',
                        zoneCode: 'CTR',
                        createdAt: '2025-09-23 14:35:32',
                        updatedAt: '2025-09-23 14:35:32'
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Unicidad o lógica',
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
        description: 'Validación',
        examples: {
            'validation-error': {
                summary: 'Errores de validación',
                value: {
                    statusCode: 422,
                    message: [
                        'firstName no debe estar vacío',
                        'email debe ser un email válido',
                        'documentNumber debe tener al menos 6 caracteres'
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
        description: 'Sin permiso create.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para crear clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para crear clientes',
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
                    message: 'Error interno del servidor al crear el cliente',
                    error: 'Internal Server Error'
                }
            }
        }
    })
    async create(
        @Body() dto: CreateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.create(dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente creado correctamente', customer };
    }

    @Post('bulk')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Crear clientes en lote',
        description: 'Carga masiva de clientes desde archivo Excel/CSV'
    })
    @ApiCreatedResponse({
        description: 'Clientes creados exitosamente',
        examples: {
            'all-success': {
                summary: 'Todos los clientes creados exitosamente',
                value: {
                    message: 'Clientes creados correctamente',
                    code: 201,
                    status: 'success',
                    data: {
                        firstCreated: {
                            id: 1,
                            firstName: 'Juan',
                            lastName: 'Pérez',
                            documentNumber: '12345678',
                            email: 'juan.perez@ejemplo.com'
                        },
                        lastCreated: {
                            id: 50,
                            firstName: 'Ana',
                            lastName: 'López',
                            documentNumber: '87654321',
                            email: 'ana.lopez@ejemplo.com'
                        },
                        totalCreated: 50,
                        totalErrors: 0,
                        errors: []
                    }
                }
            },
            'partial-success': {
                summary: 'Algunos clientes creados, otros fallaron',
                value: {
                    message: 'Algunos clientes fueron creados, otros fallaron',
                    code: 207,
                    status: 'partial_success',
                    data: {
                        firstCreated: {
                            id: 1,
                            firstName: 'Juan',
                            lastName: 'Pérez',
                            documentNumber: '12345678',
                            email: 'juan.perez@ejemplo.com'
                        },
                        lastCreated: {
                            id: 30,
                            firstName: 'Carlos',
                            lastName: 'Ruiz',
                            documentNumber: '11223344',
                            email: 'carlos.ruiz@ejemplo.com'
                        },
                        totalCreated: 30,
                        totalErrors: 20,
                        errors: [
                            {
                                row: 5,
                                data: { firstName: 'Pedro', lastName: '', email: 'invalid-email' },
                                error: 'lastName no debe estar vacío, email debe ser un email válido'
                            },
                            {
                                row: 12,
                                data: { firstName: 'Luis', lastName: 'García', email: 'juan.perez@ejemplo.com' },
                                error: 'El email ya está registrado en el sistema'
                            }
                        ]
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'No se pudo crear ningún cliente',
        examples: {
            'all-failed': {
                summary: 'No se creó ningún cliente',
                value: {
                    message: 'No se pudo crear ningún cliente',
                    code: 400,
                    status: 'error',
                    data: {
                        firstCreated: null,
                        lastCreated: null,
                        totalCreated: 0,
                        totalErrors: 50,
                        errors: [
                            {
                                row: 1,
                                data: { firstName: '', lastName: 'Pérez', email: 'invalid' },
                                error: 'firstName no debe estar vacío, email debe ser un email válido'
                            },
                            {
                                row: 2,
                                data: { firstName: 'Ana', lastName: '', email: '' },
                                error: 'lastName no debe estar vacío, email no debe estar vacío'
                            }
                        ]
                    }
                }
            },
            'invalid-file': {
                summary: 'Archivo inválido',
                value: {
                    statusCode: 400,
                    message: 'El archivo debe ser un Excel (.xlsx) o CSV (.csv)',
                    error: 'Bad Request'
                }
            }
        }
    })
    @ApiUnprocessableEntityResponse({
        description: 'Errores de validación en el archivo',
        examples: {
            'validation-error': {
                summary: 'Errores de validación del archivo',
                value: {
                    statusCode: 422,
                    message: [
                        'El archivo no contiene las columnas requeridas',
                        'Formato de archivo no válido',
                        'El archivo está vacío'
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
        description: 'Sin permiso create.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para crear clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para crear clientes',
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
                    message: 'Error interno del servidor al procesar el archivo',
                    error: 'Internal Server Error'
                }
            }
        }
    })
async createMany(
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response
    ): Promise<void> {
        // ...existing code...
    }

    @Patch(':id')
    @Permissions('update.customers')
    @ApiOperation({ summary: 'Actualizar cliente', description: 'Actualiza campos del cliente (solo cambios).' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiOkResponse({ 
        description: 'Actualizado',
        examples: {
            'success': {
                summary: 'Cliente actualizado exitosamente',
                value: {
                    customMessage: 'Cliente actualizado correctamente',
                    customer: {
                        id: 1,
                        firstName: 'Juan Carlos',
                        lastName: 'Pérez Actualizado',
                        documentNumber: '12345678',
                        email: 'juan.actualizado@ejemplo.com',
                        phone: '+57 300 999 8888',
                        isActive: true,
                        updatedAt: '2024-01-20T14:45:00.000Z'
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Sin cambios / unicidad',
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
                    message: 'El email ya está registrado por otro cliente.',
                    error: 'Bad Request'
                }
            }
        }
    })
    @ApiNotFoundResponse({ 
        description: 'No encontrado',
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
    @ApiUnprocessableEntityResponse({ 
        description: 'Validación',
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
        description: 'Sin permiso update.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para actualizar clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para actualizar clientes',
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
                    message: 'Error interno del servidor al actualizar el cliente',
                    error: 'Internal Server Error'
                }
            }
        }
    })

    @Patch(':id')
    @Permissions('update.customers')
    @ApiOperation({ summary: 'Actualizar cliente', description: 'Actualiza campos del cliente (solo cambios).' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiOkResponse({ 
        description: 'Actualizado',
        examples: {
            'success': {
                summary: 'Cliente actualizado exitosamente',
                value: {
                    customMessage: 'Cliente actualizado correctamente',
                    customer: {
                        id: 1,
                        firstName: 'Juan Carlos',
                        lastName: 'Pérez Actualizado',
                        documentNumber: '12345678',
                        email: 'juan.actualizado@ejemplo.com',
                        phone: '+57 300 999 8888',
                        isActive: true,
                        updatedAt: '2024-01-20T14:45:00.000Z'
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Sin cambios / unicidad',
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
                    message: 'El email ya está registrado por otro cliente.',
                    error: 'Bad Request'
                }
            }
        }
    })
    @ApiNotFoundResponse({ 
        description: 'No encontrado',
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
    @ApiUnprocessableEntityResponse({ 
        description: 'Validación',
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
        description: 'Sin permiso update.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para actualizar clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para actualizar clientes',
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
                    message: 'Error interno del servidor al actualizar el cliente',
                    error: 'Internal Server Error'
                }
            }
        }
    })

    @Patch(':id')
    @Permissions('update.customers')
    @ApiOperation({ summary: 'Actualizar cliente', description: 'Actualiza campos del cliente (solo cambios).' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiOkResponse({ 
        description: 'Actualizado',
        examples: {
            'success': {
                summary: 'Cliente actualizado exitosamente',
                value: {
                    customMessage: 'Cliente actualizado correctamente',
                    customer: {
                        id: 1,
                        firstName: 'Juan Carlos',
                        lastName: 'Pérez Actualizado',
                        documentNumber: '12345678',
                        email: 'juan.actualizado@ejemplo.com',
                        phone: '+57 300 999 8888',
                        isActive: true,
                        updatedAt: '2024-01-20T14:45:00.000Z'
                    }
                }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Sin cambios / unicidad',
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
                    message: 'El email ya está registrado por otro cliente.',
                    error: 'Bad Request'
                }
            }
        }
    })
    @ApiNotFoundResponse({ 
        description: 'No encontrado',
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
    @ApiUnprocessableEntityResponse({ 
        description: 'Validación',
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
        description: 'Sin permiso update.customers',
        examples: {
            'insufficient-permissions': {
                summary: 'Sin permisos para actualizar clientes',
                value: {
                    statusCode: 403,
                    message: 'No tienes permisos para actualizar clientes',
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
                    message: 'Error interno del servidor al actualizar el cliente',
                    error: 'Internal Server Error'
                }
            }
        }
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.update(id, dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente actualizado correctamente', customer };
    }
}
