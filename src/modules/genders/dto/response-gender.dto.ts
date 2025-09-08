import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponseGenderDto {
    @ApiProperty({ example: 'Masculino' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'M' })
    @Expose()
    code: string;

    @ApiProperty({ example: true })
    @Exclude()
    isActive: boolean;
}