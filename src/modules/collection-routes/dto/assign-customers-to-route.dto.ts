import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class AssignCustomersToRouteDto {
  @ApiProperty({
    description: 'ID de la ruta de cobranza a la que se asignarán los clientes',
    example: 1,
  })
  @IsInt({ message: 'El ID de la ruta debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la ruta es requerido' })
  collectionRouteId: number;

  @ApiProperty({
    description: 'Array de IDs de los clientes a asignar',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray({ message: 'customerIds debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un cliente' })
  @IsInt({ each: true, message: 'Cada ID de cliente debe ser un número entero' })
  customerIds: number[];
}
