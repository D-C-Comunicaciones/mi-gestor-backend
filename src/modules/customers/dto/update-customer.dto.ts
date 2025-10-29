import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { IsBoolean, IsDateString, IsEmail, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
    @ApiPropertyOptional({ example: 2233344455 }) @IsOptional() @IsInt() @IsPositive() documentNumber?: number;
    @ApiPropertyOptional({ example: '1993-10-10' }) @IsOptional() @IsDateString() birthDate?: string;
    @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsInt() @IsPositive() typeDocumentIdentificationId?: number;
    @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsInt() @IsPositive() genderId?: number;
    @ApiPropertyOptional({ example: 'nuevo@migestor.com' }) @IsOptional() @IsEmail() email?: string;
    @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}
