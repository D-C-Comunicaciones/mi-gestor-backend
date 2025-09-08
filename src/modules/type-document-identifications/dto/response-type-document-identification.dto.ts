import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponseTypeDocumentIdentificationDto {
    @ApiProperty({ example: 1 })
    @Expose()
    id: number;

    @ApiProperty({ example: 'Cédula de Ciudadanía' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'CC' })
    @Expose()
    code: string;

    @ApiProperty({ example: true })
    @Exclude()
    isActive: boolean;
}