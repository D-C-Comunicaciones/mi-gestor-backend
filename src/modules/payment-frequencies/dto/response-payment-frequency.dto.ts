import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";

export class ResponsePaymentFrequencyDto {
    @ApiProperty({ example: 1, description: 'Identificador único de la frecuencia de pago' })
    @Expose()
    id: number;

    @ApiProperty({ example: 'intereses mensuales', description: 'Nombre de la frecuencia de pago' })
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


    @ApiProperty({ example: true, description: 'Indica si la frecuencia de pago está activa' })
    @Exclude()
    isActive: boolean;
}