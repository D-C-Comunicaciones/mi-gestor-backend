import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponseTypeDocumentIdentificationDto {
    @ApiProperty({
        description: 'Identificador único del tipo de documento',
        example: 1,
        type: 'number'
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Nombre del tipo de documento',
        example: 'Cédula de Ciudadanía',
        type: 'string'
    })
    @Expose()
    name: string;

    @ApiProperty({
        description: 'Código abreviado del tipo de documento',
        example: 'CC',
        type: 'string'
    })
    @Expose()
    code: string;

    @ApiProperty({
        description: 'Descripción detallada del tipo de documento',
        example: 'Documento de identificación para ciudadanos colombianos',
        type: 'string',
        required: false
    })
    @Expose()
    description?: string;

    @ApiProperty({
        description: 'Estado activo/inactivo del tipo de documento',
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