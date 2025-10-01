import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNoteDto {
  @ApiProperty({
    description: 'ID del registro al que se asocia la nota',
    example: 1,
    type: 'integer'
  })
  @Type(() => Number)
  @IsInt({ message: 'El ID del modelo debe ser un número entero' })
  @IsPositive({ message: 'El ID del modelo debe ser un número positivo' })
  @IsNotEmpty({ message: 'El ID del modelo es requerido' })
  modelId: number;

  @ApiProperty({
    description: 'Nombre del modelo al que se asocia la nota',
    example: 'loan',
    enum: ['loan', 'customer', 'collector', 'payment', 'installment'],
    enumName: 'ModelType'
  })
  @IsString({ message: 'El modelo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El modelo es requerido' })
  model: string;

  @ApiProperty({
    description: 'Contenido de la nota',
    example: 'Cliente no se encontraba en casa. Se intentó cobro a las 10:00 AM. Vecinos indican que regresa por la tarde.',
    minLength: 5,
    maxLength: 1000
  })
  @IsString({ message: 'El contenido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El contenido de la nota es requerido' })
  @MinLength(5, { message: 'El contenido debe tener al menos 5 caracteres' })
  @MaxLength(1000, { message: 'El contenido no puede exceder 1000 caracteres' })
  content: string;
}
