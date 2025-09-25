import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns/format';

/**
 * DTO para la respuesta de empresa
 * Contiene la información completa de una empresa del sistema
 * Utilizado para mostrar los datos corporativos configurados
 */
export class ResponseCompanyDto {
    @ApiProperty({
        description: 'Identificador único de la empresa',
        example: 1,
        type: 'integer'
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Nombre de la empresa',
        example: 'Mi Gestor Financiero S.A.S',
        type: 'string'
    })
    @Expose()
    name: string;

    @ApiProperty({
        description: 'Número de identificación tributaria (NIT)',
        example: '900123456-7',
        type: 'string'
    })
    @Expose()
    identificationNumber: string;

    @ApiProperty({
        description: 'Dirección física de la empresa',
        example: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.',
        type: 'string'
    })
    @Expose()
    address: string;

    @ApiProperty({
        description: 'Número de teléfono de contacto',
        example: '+57 1 234 5678',
        type: 'string'
    })
    @Expose()
    phone: string;

    @ApiProperty({
        description: 'Correo electrónico corporativo',
        example: 'contacto@migestorfinanciero.com',
        type: 'string',
        format: 'email'
    })
    @Expose()
    email: string;

    @ApiProperty({
        description: 'URL del logo de la empresa',
        example: 'logos/logo.png',
        type: 'string',
        required: false
    })
    @Expose()
    logoUrl?: string;

    @ApiProperty({
        description: 'Fecha de creación del registro',
        example: '2024-01-01 10:00:00',
        type: 'string'
    })
    @Expose()
    @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
    createdAt: Date;

    @ApiProperty({
        description: 'Fecha de última actualización',
        example: '2024-01-15 14:30:00',
        type: 'string'
    })
    @Expose()
    @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
    updatedAt: Date;
}