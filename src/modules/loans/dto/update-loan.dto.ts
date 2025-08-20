import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLoanDto } from './create-loan.dto';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @ApiPropertyOptional({ description: 'Saldo restante actualizado' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() remainingBalance?: number;

  @ApiPropertyOptional({ description: 'Activo/Inactivo' })
  @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID nuevo estado' })
  @IsOptional() @IsInt() loanStatusId?: number;

  @ApiPropertyOptional({ description: 'Nueva fecha próxima de pago' })
  @IsOptional() @IsDateString() nextDueDate?: string;

  @ApiPropertyOptional({ description: 'Nuevo monto cuota' })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) paymentAmount?: number;

  @ApiPropertyOptional({ description: 'Nuevo número de cuotas' })
  @IsOptional() @IsInt() term?: number;
}
