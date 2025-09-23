import { PartialType } from '@nestjs/swagger';
import { CreateLoanDto } from './create-loan.dto';

// `PartialType` hace que todas las propiedades de CreateLoanDto sean opcionales
export class RefinanceLoanDto extends PartialType(CreateLoanDto) {}