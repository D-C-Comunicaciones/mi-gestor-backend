import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ResponseTermDto {
    @ApiProperty({ example: 1, description: 'Identificador único de la cuota' })
    @Expose()
    id: number;

    @ApiProperty({ example: 12, description: 'Número de cuotas' })
    @Expose()
    value: number;
}