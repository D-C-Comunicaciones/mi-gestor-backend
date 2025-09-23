import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

export class ResponsePenaltyRateDto {
  @ApiProperty({ example: 1, description: 'Identificador único de la tasa de penalización' })
  @Expose()
  id: number;

  @ApiProperty({ example: 0.05, description: 'Nombre de la tasa de penalización' })
  @Expose()
  name: string;

  @ApiProperty({ example: new Date(), description: 'procentaje de tasa de penalizacion %' })
  @Expose()
  value: number;

  @ApiProperty({ example: true, description: 'Indica si la tasa de penalización está activa' })
  @Exclude()
  isActive: boolean;
}