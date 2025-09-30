import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateZoneDto {
    @ApiProperty({ 
        description: 'Nombre de la zona geográfica', 
        example: 'Centro',
        maxLength: 50,
        minLength: 2
    })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
    name: string;

    @ApiProperty({ 
        description: 'Código único de la zona', 
        example: 'CTR',
        maxLength: 10,
        minLength: 1
    })
    @IsString({ message: 'El código debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El código es requerido' })
    @MinLength(1, { message: 'El código debe tener al menos 1 caracter' })
    @MaxLength(10, { message: 'El código no puede exceder 10 caracteres' })
    code: string;
}
