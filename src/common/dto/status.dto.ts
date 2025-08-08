import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class StatusDto {
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: `El campo [status] debe ser un valor booleano: true, false, 1 o 0` })
  status: boolean;
}
