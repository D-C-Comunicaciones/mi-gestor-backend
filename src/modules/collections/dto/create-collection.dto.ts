import { IsNumber, IsPositive } from 'class-validator';

export class CreateCollectionDto {

  @IsNumber()
  installmentId: number; // <-- ID de la cuota que se está pagando

  @IsNumber()
  @IsPositive()
  amount: number;

}
