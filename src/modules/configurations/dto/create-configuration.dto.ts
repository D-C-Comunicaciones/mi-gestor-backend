import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para la creación de configuración del sistema
 * Define los parámetros de configuración global como moneda, zona horaria y paleta de colores
 * Utilizado por administradores para personalizar el sistema
 */
export class CreateConfigurationDto {
    @ApiPropertyOptional({ 
        description: 'ID de la moneda (FK a Currency)',
        example: 1,
        type: 'integer',
        minimum: 1
    })
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la moneda debe ser un número' })
    @Type(() => Number)
    currencyId?: number;

    @ApiPropertyOptional({ 
        description: 'ID de la zona horaria (FK a timezone)',
        example: 1,
        type: 'integer',
        minimum: 1
    })
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la zona horaria debe ser un número' })
    @Type(() => Number)
    timezoneId?: number;

    @ApiPropertyOptional({ 
        description: 'Paleta de colores en formato string (ejemplo: "#123456,#abcdef,...")',
        example: '#FFFFFF,#000000,#007BFF',
        type: 'string'
    })
    @IsOptional()
    @IsString({ message: 'La paleta de colores debe ser una cadena de texto' })
    colorPalette?: string;
}