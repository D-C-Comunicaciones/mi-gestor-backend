// File: src/modules/reports/dto/interest-report-pagination.dto.ts (Nueva versión)
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsIn, Min, Max } from 'class-validator';
import { DateRangeDto } from '@common/dto'; 
// Asume que PaginationDto está disponible para herencia o se incluye aquí

const LOAN_STATUSES = ['Paid', 'Overdue', 'Pending', 'Refinanced', 'Created'];

export class InterestReportPaginationDto extends DateRangeDto {

  @ApiProperty({
    description: 'Filtro por estado específico de crédito. Permite filtrar el reporte solo por créditos en un estado determinado. Se excluyen automáticamente los créditos Cancelados e Inactivos.',
    example: 'Paid',
    required: false,
    enum: LOAN_STATUSES,
    enumName: 'LoanStatusFilter',
    examples: {
      'paid': {
        summary: 'Solo créditos pagados',
        description: 'Filtra únicamente los créditos que han sido completamente pagados',
        value: 'Paid'
      },
      'overdue': {
        summary: 'Solo créditos en mora',
        description: 'Filtra únicamente los créditos que tienen cuotas vencidas',
        value: 'Overdue'
      },
      'pending': {
        summary: 'Solo créditos pendientes',
        description: 'Filtra únicamente los créditos con cuotas pendientes pero no vencidas',
        value: 'Pending'
      }
    }
  })
  @IsOptional()
  @IsIn(LOAN_STATUSES, { 
    message: `El estado del crédito debe ser uno de los siguientes: ${LOAN_STATUSES.join(', ')}` 
  })
  loanStatusName?: string; 
  
  @ApiProperty({
    description: 'Número de página para la paginación de resultados. Debe ser un número entero positivo mayor a 0.',
    example: 1,
    required: false,
    type: 'integer',
    minimum: 1,
    default: 1,
    examples: {
      'first-page': {
        summary: 'Primera página',
        description: 'Obtener los primeros resultados',
        value: 1
      },
      'specific-page': {
        summary: 'Página específica',
        description: 'Navegar a una página específica de resultados',
        value: 3
      }
    }
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive({ message: 'El número de página debe ser un número positivo' })
  @Min(1, { message: 'El número de página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad máxima de registros por página. Controla cuántos elementos se retornan en cada página de resultados. El valor mínimo es 1 y el máximo es 100.',
    example: 10,
    required: false,
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    examples: {
      'small-page': {
        summary: 'Página pequeña',
        description: 'Para obtener pocos resultados por página',
        value: 5
      },
      'standard-page': {
        summary: 'Página estándar',
        description: 'Tamaño de página recomendado',
        value: 10
      },
      'large-page': {
        summary: 'Página grande',
        description: 'Para obtener más resultados por página',
        value: 50
      },
      'max-page': {
        summary: 'Página máxima',
        description: 'Máximo número de resultados permitidos por página',
        value: 100
      }
    }
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive({ message: 'El límite debe ser un número positivo' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 10;
}