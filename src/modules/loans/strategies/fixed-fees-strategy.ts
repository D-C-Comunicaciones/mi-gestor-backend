import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateLoanDto } from '../dto';
import { LoanStrategy, LoanCreationData } from './interfaces/loan-strategy.interface';

@Injectable()
export class FixedFeesStrategy implements LoanStrategy {
  
  async validateDto(dto: CreateLoanDto): Promise<void> {
    if (dto.gracePeriodId) {
      throw new BadRequestException('Periodo de Gracia no debe ser proporcionado para créditos de cuotas fijas');
    }
  }

  async prepareLoanData(dto: CreateLoanDto, tx: Prisma.TransactionClient): Promise<LoanCreationData> {
    let termId: number;
    let termValue: number;

    if (dto.termId) {
      const term = await tx.term.findUnique({ where: { id: dto.termId } });
      if (!term) {
        throw new BadRequestException(`Término con ID ${dto.termId} no encontrado`);
      }
      termId = term.id;
      termValue = term.value;
    } else {
      // Crear término por defecto de 12 cuotas
      termValue = 12;
      const newTerm = await tx.term.create({ data: { value: termValue } });
      termId = newTerm.id;
    }

    return {
      termId,
      termValue,
      gracePeriodId: undefined,
      gracePeriodMonths: null,
      graceEndDate: null,
    };
  }

  getLoanTypeName(): string {
    return 'fixed_fees';
  }
}
