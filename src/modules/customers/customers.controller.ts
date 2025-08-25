import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
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
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Clientes obtenidos correctamente' },
                code: { type: 'number', example: 200 },
                status: { type: 'string', example: 'success' },
                data: {
                    type: 'object',
                    properties: {
                        customers: { type: 'array', items: { $ref: getSchemaPath(ResponseCustomerDto) } },
                        meta: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 10 },
                                page: { type: 'number', example: 1 },
                                lastPage: { type: 'number', example: 1 },
                                limit: { type: 'number', example: 10 },
                                hasNextPage: { type: 'boolean', example: false }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({ description: 'No existen registros', schema: { example: { message: 'No existen registros', code: 404, status: 'error' } } })
    @ApiUnauthorizedResponse({ description: 'No autenticado' })
    @ApiForbiddenResponse({ description: 'Sin permiso view.customers' })
    @ApiInternalServerErrorResponse({ description: 'Error interno' })
@Get()
  async findAll(
    @Query() paginationDto: CustomerPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CustomerListResponse> {
    const { customers, meta } = await this.customersService.findAll(paginationDto);

    if (customers.length === 0) {
      res.status(404);
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
        schema: {
            example: {
                message: 'Cliente obtenido correctamente',
                code: 200,
                status: 'success',
                data: { customer: { id: 1, firstName: 'Juan', lastName: 'Pérez' } }
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Cliente no encontrado', schema: { example: { message: 'Cliente no encontrado', code: 404, status: 'error' } } })
    @ApiUnauthorizedResponse({ description: 'No autenticado' })
    @ApiForbiddenResponse({ description: 'Sin permiso view.customers' })
    @ApiInternalServerErrorResponse({ description: 'Error interno' })
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
    @ApiBody({ type: CreateCustomerDto })
    @ApiCreatedResponse({
        description: 'Cliente creado',
        schema: {
            example: {
                message: 'Cliente creado correctamente',
                code: 201,
                status: 'success',
                data: { customer: { id: 1, firstName: 'Juan', lastName: 'Pérez' } }
            }
        }
    })
    @ApiBadRequestResponse({ description: 'Unicidad o lógica', schema: { example: { message: 'El número de documento ya está registrado.', code: 400, status: 'error' } } })
    @ApiUnprocessableEntityResponse({ description: 'Validación', schema: { example: { message: 'Los datos enviados no son válidos.', code: 422, status: 'error' } } })
    @ApiUnauthorizedResponse({ description: 'No autenticado' })
    @ApiForbiddenResponse({ description: 'Sin permiso create.customers' })
    @ApiInternalServerErrorResponse({ description: 'Error interno' })
    async create(
        @Body() dto: CreateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.create(dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente creado correctamente', customer };
    }

    @Patch(':id')
    @Permissions('update.customers')
    @ApiOperation({ summary: 'Actualizar cliente', description: 'Actualiza campos del cliente (solo cambios).' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiOkResponse({ description: 'Actualizado', schema: { example: { message: 'Cliente actualizado correctamente', code: 200, status: 'success', data: { customer: { id: 1 } } } } })
    @ApiBadRequestResponse({ description: 'Sin cambios / unicidad', schema: { example: { message: 'No se detectaron cambios.', code: 400, status: 'error' } } })
    @ApiNotFoundResponse({ description: 'No encontrado' })
    @ApiUnprocessableEntityResponse({ description: 'Validación' })
    @ApiUnauthorizedResponse({ description: 'No autenticado' })
    @ApiForbiddenResponse({ description: 'Sin permiso update.customers' })
    @ApiInternalServerErrorResponse({ description: 'Error interno' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.update(id, dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente actualizado correctamente', customer };
    }
}
