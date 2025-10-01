import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignCollectorToRouteDto {
  @ApiProperty({
    description: 'ID del cobrador a asignar a la ruta',
    example: 1,
  })
  @IsInt({ message: 'El ID del cobrador debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID del cobrador es requerido' })
  collectorId: number;
}
