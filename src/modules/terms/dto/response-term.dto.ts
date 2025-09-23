import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ResponseTermDto {
    @ApiProperty({
        description: 'Identificador único del término',
        example: 1,
        type: 'number'
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Nombre del término',
        example: '12 meses',
        type: 'string'
    })
    @Expose()
    name: string;

    @ApiProperty({
        description: 'Número de cuotas del término',
        example: 12,
        type: 'number'
    })
    @Expose()
    numberOfInstallments: number;

    @ApiProperty({
        description: 'Descripción detallada del término',
        example: 'Plazo de 12 cuotas mensuales',
        type: 'string',
        required: false
    })
    @Expose()
    description?: string;

    @ApiProperty({
        description: 'Estado activo/inactivo del término',
        example: true,
        type: 'boolean'
    })
    @Expose()
    isActive: boolean;

    @ApiProperty({
        description: 'Fecha de creación del registro',
        example: '2024-01-15T10:30:00.000Z',
        type: 'string',
        format: 'date-time'
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: 'Fecha de última actualización del registro',
        example: '2024-01-20T14:45:00.000Z',
        type: 'string',
        format: 'date-time'
    })
    @Expose()
    updatedAt: Date;
}