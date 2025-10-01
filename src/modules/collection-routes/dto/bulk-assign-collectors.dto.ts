import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, IsOptional } from 'class-validator';

export class BulkAssignCollectorsDto {
  @ApiProperty({
    description: 'Array de IDs de rutas a las que se asignarán cobradores',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'routeIds debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una ruta' })
  @IsInt({ each: true, message: 'Cada ID de ruta debe ser un número entero' })
  routeIds: number[];

  @ApiProperty({
    description: 'Array de IDs de cobradores a asignar (null para desasignar)',
    example: [1, 2, null],
    type: [Number],
    required: false,
  })
  @IsArray({ message: 'collectorIds debe ser un array' })
  @IsOptional()
  collectorIds?: (number | null)[];

  @ApiProperty({
    description: 'ID único del cobrador para asignar a todas las rutas',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID del cobrador debe ser un número entero' })
  singleCollectorId?: number | null;
}
