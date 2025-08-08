import { IsString, IsInt, IsIn } from 'class-validator';
import { TypeUser } from '../interfaces';
import { Transform } from 'class-transformer';

export class ActivateAccountDto {
  @IsString()
  token: string;

  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;

  @IsIn(['STUDENT', 'TEACHER', 'GUARDIAN'], {
    message: 'Tipo de usuario inválido. Valores permitidos: STUDENT, TEACHER, GUARDIAN',
  })
  typeUser: TypeUser;
}
