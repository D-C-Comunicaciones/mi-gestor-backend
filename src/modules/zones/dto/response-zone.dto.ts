import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponseZoneDto {
    @ApiProperty({ example: 1, description: 'Zone ID' })
    @Expose()
    id: number;

    @ApiProperty({ example: 'Zona Norte', description: 'Zone Name' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'NRT', description: 'Zone Code' })
    @Expose()
    code: string;

    @ApiProperty({ example: true, description: 'Is Zone Active' })
    @Exclude()
    isActive: boolean;
}