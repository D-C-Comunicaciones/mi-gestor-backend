import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponseGracePeriodDto {
    @ApiProperty({ example: '1', description: 'identificador único del periodo de gracia.' })
    @Expose()
    id: number;

    @ApiProperty({ example: '15 días', description: 'Nombre el periodo de gracia.' })
    @Expose()
    name: string;

    @ApiProperty({ example: '30', description: 'Numero de dias del periodo de gracia.' })
    @Expose()   
    days: number;

    @ApiProperty({ example: 'true', description: 'Indica si el registro está activo.' })
    @Exclude()
    isActive: boolean;
}