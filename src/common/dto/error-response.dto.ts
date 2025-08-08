import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({ example: 'El estado ya se encuentra en ACTIVE' })
  message: string;

  @ApiProperty({ example: 400 })
  code: number;

  @ApiProperty({ example: 'error' })
  status: string;

  @ApiProperty({ example: null, nullable: true })
  errors: any;

  @ApiProperty({ example: 'BadRequestException: El estado ya se encuentra en ACTIVE\n    at ...' })
  trace: string;
}