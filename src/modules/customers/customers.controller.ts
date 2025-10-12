import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Query, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerPaginationDto, CreateCustomerDto, UpdateCustomerDto, ResponseCustomerDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { CustomerDetailResponse, CustomerListResponse, CustomerResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { ResponseLoanDto } from '@modules/loans/dto';
import { UserResponseDto } from '@modules/users/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerCreateManyCustomersDoc, SwaggerCreateCustomerDoc, SwaggerFindAllCustomersDoc, SwaggerFindOneCustomerDoc, SwaggerUpdateCustomerDoc } from '@common/decorators/swagger/customers';

@ApiTags('Customers')
@ApiBearerAuth()
@ApiExtraModels(ResponseCustomerDto)
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    @Permissions('view.customers')
    @SwaggerFindAllCustomersDoc()
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
    @SwaggerFindOneCustomerDoc()
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
    @SwaggerCreateCustomerDoc()
    async create(
        @Body() dto: CreateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.create(dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente creado correctamente', customer };
    }

    @Post('bulk')
    @Permissions('create.customers')
    @UseInterceptors(FileInterceptor('file'))
    @SwaggerCreateManyCustomersDoc()
    async createMany(
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo.');
        }

        const result = await this.customersService.createMany(file);

        const { totalCreated, totalErrors } = result;

        if (totalCreated > 0 && totalErrors === 0) {
            // Éxito total
            return res.status(201).json({
                customMessage: 'Clientes creados correctamente',
                data: result,
            });
        } else if (totalCreated > 0 && totalErrors > 0) {
            // Éxito parcial
            return res.status(207).json({
                customMessage: 'Algunos clientes fueron creados, pero se encontraron errores en otros.',
                data: result,
            });
        } else {
            // Fracaso total
            return res.status(400).json({
                customMessage: 'No se pudo crear ningún cliente debido a errores en el archivo.',
                data: result,
            });
        }
    }

    @Patch(':id')
    @SwaggerUpdateCustomerDoc()
    @Permissions('update.customers')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerDto,
    ): Promise<CustomerResponse> {
        const raw = await this.customersService.update(id, dto);
        const customer = plainToInstance(ResponseCustomerDto, raw, { excludeExtraneousValues: true });
        return { customMessage: 'Cliente actualizado correctamente', customer };
    }
}
