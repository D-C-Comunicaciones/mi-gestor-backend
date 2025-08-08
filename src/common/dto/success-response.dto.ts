import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T> {
  @ApiProperty({ example: 'Estudiante actualizado correctamente' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty()
  data: T;
}