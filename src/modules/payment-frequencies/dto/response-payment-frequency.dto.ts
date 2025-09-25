import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";

export class ResponsePaymentFrequencyDto {
    @ApiProperty({
        description: 'Identificador único de la frecuencia de pago',
        example: 1,
        type: 'number'
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Nombre de la frecuencia de pago',
        example: 'Mensual',
        type: 'string'
    })
    @Expose()
    @Transform(({ value }) => {
        if (value === 'Daily') return 'Diario';
        if (value === 'Weekly') return 'Semanal';
        if (value === 'Biweekly') return 'Quincenal';
        if (value === 'Monthly') return 'Mensual';
        if (value === 'Minute') return 'Minuto - (solo de prueba)';
        return value;
    })
    name: string;

    @ApiProperty({
        description: 'Descripción detallada de la frecuencia de pago',
        example: 'Pago que se realiza cada mes',
        type: 'string',
        required: false
    })
    @Expose()
    @Transform(({ value }) => {
        if (value === 'Daily') return 'Pago que se realiza diariamente';
        if (value === 'Weekly') return 'Pago que se realiza semanalmente';
        if (value === 'Biweekly') return 'Pago que se realiza quincenalmente';
        if (value === 'Monthly') return 'Pago que se realiza cada mes';
        if (value === 'Minute') return 'Pago que se realiza cada minuto - (solo de prueba)';
        return value;
    })
    description: string;

    @ApiProperty({
        description: 'Número de días que representa la frecuencia',
        example: 30,
        type: 'number'
    })
    @Expose()
    days: number;

    @ApiProperty({
        description: 'Estado activo/inactivo de la frecuencia',
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