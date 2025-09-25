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
        description: 'Número de cuotas del término',
        example: 12,
        type: 'number'
    })
    @Expose()
    value: number;
}
