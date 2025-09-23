import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";

export class ResponseLoantypeDto {
    @ApiProperty({ example: 1, description: 'Loan type ID' })
    @Expose()
    id: number;

    @ApiProperty({ example: 'intereses mensuales', description: 'Translated Loan type name' })
    @Expose()
    @Transform(({ value }) => {
        if (value === 'only_interests') return 'intereses mensuales';
        if (value === 'fixed_fees') return 'cuotas fijas';
        return value;
    })
    name: string;

    @ApiProperty({ example: true, description: 'Is Active' })
    @Exclude()
    isActive: boolean;
}
