import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto, UpdateLoanDto } from './dto';
import { LoanPaginationDto } from './dto/loan-pagination.dto';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiNotFoundResponse,
  ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiQuery, ApiExtraModels, getSchemaPath,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ResponseLoanDto } from './dto';
import { LoanByCustomerResponse, LoanListResponse, LoanResponse, LoanUpdateResponse, RefinanceLoanResponse } from './interfaces';
import { ResponseLoanWithInstallmentsDto } from './dto/response-loan-by-customer.dto';
import { RefinanceLoanDto } from './dto';

@ApiTags('Loans')
@ApiBearerAuth()
@ApiExtraModels(ResponseLoanDto)
@Controller('loans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) { }

  @Get()
  @Permissions('view.loans')
  @ApiOperation({ summary: 'Listar préstamos', description: 'Retorna lista paginada de préstamos.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
  @ApiQuery({ name: 'include', required: false, schema: { type: 'string', example: 'customer,installments' } })
  @ApiOkResponse({
    description: 'Listado obtenido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Préstamos obtenidos correctamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            loans: { type: 'array', items: { $ref: getSchemaPath(ResponseLoanDto) } },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 5 },
                page: { type: 'number', example: 1 },
                lastPage: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                hasNextPage: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No existen registros' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  @ApiForbiddenResponse({ description: 'Sin permiso view.loans' })
  async findAll(
    @Query() paginationDto: LoanPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoanListResponse> {
    const { loans, meta } = await this.loansService.findAll(paginationDto);
    const arr = Array.isArray(loans) ? loans : [loans];

    if (arr.length === 0) {
      res.status(404);
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
  @Get(':id')
  @Permissions('view.loans')
  @ApiOperation({ summary: 'Obtener préstamo', description: 'Retorna un préstamo por id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiQuery({ name: 'include', required: false, schema: { type: 'string', example: 'customer,installments' } })
  @ApiOkResponse({
    description: 'Préstamo encontrado',
    schema: {
      example: {
        message: 'Préstamo obtenido correctamente',
        code: 200,
        status: 'success',
        data: { loan: { id: 1 } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Préstamo no encontrado' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('include') include?: string,
  ): Promise<LoanResponse> {
    const raw = await this.loansService.findOne(id, include);
    const [loan] = plainToInstance(ResponseLoanDto, [raw], { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamo obtenido correctamente',
      loan,
    };
  }

  @Post()
  @Permissions('create.loans')
  @ApiOperation({ summary: 'Crear préstamo', description: 'Crea un préstamo (puede generar cuotas).' })
  @ApiCreatedResponse({
    description: 'Préstamo creado',
    schema: {
      example: {
        message: 'Préstamo creado correctamente',
        code: 201,
        status: 'success',
        data: { loan: { id: 1 } },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validación / lógica' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
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

  @Patch(':id')
  @Permissions('update.loans')
  @ApiOperation({ summary: 'Actualizar préstamo', description: 'Actualiza campos cambiados.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Préstamo actualizado',
    schema: {
      example: {
        message: 'Préstamo actualizado correctamente',
        code: 200,
        status: 'success',
        data: { loan: { id: 1 } },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sin cambios' })
  @ApiNotFoundResponse({ description: 'Préstamo no encontrado' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoanDto,
  ): Promise<LoanUpdateResponse> {
    const { updated, changes } = await this.loansService.update(id, dto);
    const loan = plainToInstance(ResponseLoanDto, updated, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamo actualizado correctamente',
      loan,
      changes,
    };
  }

  @Post(':id/refinance')
  @Permissions('refinance.loans')
  @ApiOperation({ summary: 'Refinanciar préstamo', description: 'Refinancia un préstamo inactivo, creando uno nuevo.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Préstamo refinanciado',
    schema: {
      example: {
        message: 'Préstamo refinanciado exitosamente',
        code: 200,
        status: 'success',
        data: {
          oldLoan: { id: 1 },
          newLoan: { id: 2 }
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validación / lógica' })
  @ApiNotFoundResponse({ description: 'Préstamo a refinanciar no encontrado' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async refinance(
    @Param('id', ParseIntPipe) loanId: number,
    @Body() dto: RefinanceLoanDto, // 👈 Se usa el nuevo DTO aquí
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
    type: ResponseLoanWithInstallmentsDto, // 👈 Aquí
  })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  async getLoansByCustomer(@Param('id', ParseIntPipe) id: number): Promise<LoanByCustomerResponse> {
    const rawLoansByCustomer = await this.loansService.getLoansByCustomer(id);
    const loanByCustomer = plainToInstance(ResponseLoanWithInstallmentsDto, rawLoansByCustomer, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamos obtenidos correctamente',
      loanByCustomer,
    };
  }
  @Delete(':id')
  @Permissions('delete.loans')
  @ApiOperation({ summary: 'Inactivar préstamo', description: 'Soft delete (isActive=false).' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Préstamo inactivado',
    schema: {
      example: {
        message: 'Préstamo inactivado correctamente',
        code: 200,
        status: 'success',
        data: { loan: { id: 1, isActive: false } },
      },
    },
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<LoanResponse> {
    const deletedLoan = await this.loansService.softDelete(id);
    const loan = plainToInstance(ResponseLoanDto, deletedLoan, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamo inactivado correctamente',
      loan,
    };
  }
}