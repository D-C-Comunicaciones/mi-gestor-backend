import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto, ResponseOverdueLoanDto, LoanPaginationDto } from './dto';
import { PaginationDto } from '@common/dto';
import { LoanByCustomerResponse, LoanListResponse, LoanResponse, RefinanceLoanResponse, OverdueLoansResponse } from './interfaces';
import { Response } from 'express';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ResponseLoanDto } from './dto';
import { ResponseLoanWithInstallmentsDto } from './dto/response-loan-by-customer.dto';
import { RefinanceLoanDto } from './dto';
import { SwaggerCancelLoan, SwaggerCreateLoan, SwaggerListLoans, SwaggerLoanById, SwaggerOverdueLoans, SwaggerRefinanceLoan, SwaggerViewLoanByCustomerId } from '@common/decorators';

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
  @SwaggerListLoans()
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
  @SwaggerOverdueLoans()
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
  @SwaggerLoanById()
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
  @SwaggerCreateLoan()
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

  @Post(':id/refinance')
  @Permissions('refinance.loans')
  @SwaggerRefinanceLoan()
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
  @SwaggerViewLoanByCustomerId()
  async getLoansByCustomer(@Param('id', ParseIntPipe) id: number): Promise<LoanByCustomerResponse> {
    const rawLoansByCustomer = await this.loansService.getLoansByCustomer(id);
    const loanByCustomer = plainToInstance(ResponseLoanWithInstallmentsDto, rawLoansByCustomer, { excludeExtraneousValues: true });
    return {
      customMessage: 'Préstamos obtenidos correctamente',
      loanByCustomer,
    };
  }

  @Patch(':id/cancel')
  @SwaggerCancelLoan()
  async cancelLoan(@Param('id', ParseIntPipe) id: number): Promise <LoanResponse>  {
    const rawLoan = await this.loansService.cancelLoan(id);
    const loan = plainToInstance(ResponseLoanDto, rawLoan, { excludeExtraneousValues: true });
    return {
      customMessage: 'Crédito cancelado correctamente',
      loan
    };
  }
}
