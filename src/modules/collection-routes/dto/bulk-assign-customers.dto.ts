import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, ArrayMinSize, IsOptional } from 'class-validator';

export class BulkAssignCustomersDto {
  @ApiProperty({
    description: 'Array de IDs de clientes a asignar',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray({ message: 'customerIds debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un cliente' })
  @IsInt({ each: true, message: 'Cada ID de cliente debe ser un número entero' })
  customerIds: number[];

  @ApiProperty({
    description: 'Array de IDs de rutas correspondientes a cada cliente (null para desasignar)',
    example: [1, 2, 1, null, 3],
    type: [Number],
    required: false,
  })
  @IsArray({ message: 'routeIds debe ser un array' })
  @IsOptional()
  routeIds?: (number | null)[];

  @ApiProperty({
    description: 'ID único de ruta para asignar a todos los clientes',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID de la ruta debe ser un número entero' })
  singleRouteId?: number | null;
}
