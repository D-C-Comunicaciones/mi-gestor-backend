import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ResponseImportDto {
  @ApiProperty() @Expose() startedAt: string;
  @ApiPropertyOptional() @Expose() completedAt?: string | null;

  @ApiProperty({ example: 'importCustomers.xls' }) @Expose() fileName: string;
  @ApiProperty({ example: 100 }) @Expose() totalRecords: number;
  @ApiProperty({ example: 90 }) @Expose() successfulRecords: number;
  @ApiProperty({ example: 10 }) @Expose() errorRecords: number;
  @ApiProperty({ example: 'Completed' }) @Expose() status: string;

  @ApiPropertyOptional({ example: "Se encontraron 2 errores" })
  @Expose()
  errorMessage?: string | null;

  @ApiProperty({
    example: [
      {
        row: 2,
        field: "Número de documento",
        value: 102050306,
        message: "El número de documento ya está registrado.",
        type: "duplicate_document",
      },
    ],
  })
  @Expose()
  errorDetails?: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
    type: string;
  }> | null;
}
