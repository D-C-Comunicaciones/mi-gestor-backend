import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeStatusCollectionRouteDto {
  @ApiProperty({
    description: 'Estado de activación de la ruta',
    example: false,
  })
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  isActive: boolean;
}
