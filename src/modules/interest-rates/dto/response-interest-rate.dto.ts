import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ResponseInterestRateDto {
    @ApiProperty({ example: 1, description: 'Identificador único de la tasa de interés' })
    @Expose()
    id: number;

    @ApiProperty({ example: '15%', description: 'Nombre de la tasa de interés' })
    @Expose()
    name: string;

    @ApiProperty({ example: 15.0, description: 'Valor de la tasa de interés' })
    @Expose()
    value: number;
}