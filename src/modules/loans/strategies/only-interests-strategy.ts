import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateLoanDto } from '../dto';
import { LoanStrategy, LoanCreationData } from './interfaces/loan-strategy.interface';

@Injectable()
export class OnlyInterestsStrategy implements LoanStrategy {
  
  async validateDto(dto: CreateLoanDto): Promise<void> {
    if (dto.termId) {
      throw new BadRequestException('# de cuotas no debe ser proporcionado para créditos de solo intereses');
    }
    if (!dto.gracePeriodId) {
      throw new BadRequestException('GracePeriodId requerido para créditos de solo intereses');
    }
  }

  async prepareLoanData(dto: CreateLoanDto, tx: Prisma.TransactionClient): Promise<LoanCreationData> {
    const gracePeriod = await tx.gracePeriod.findUnique({ 
      where: { id: dto.gracePeriodId } 
    });
    
    if (!gracePeriod) {
      throw new BadRequestException(`GracePeriod con ID ${dto.gracePeriodId} no encontrado`);
    }

    const gracePeriodMonths = gracePeriod.days / 30;
    const graceEndDate = new Date();
    graceEndDate.setDate(graceEndDate.getDate() + gracePeriod.days);

    return {
      termId: undefined,
      termValue: null,
      gracePeriodId: gracePeriod.id,
      gracePeriodMonths,
      graceEndDate,
    };
  }

  getLoanTypeName(): string {
    return 'only_interests';
  }
}
