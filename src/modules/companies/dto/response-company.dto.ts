import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseCompanyDto {
  @ApiProperty({ example: 1, description: 'ID único de la empresa' })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Mi Gestor Financiero S.A.S', description: 'Razón social de la empresa' })
  @Expose()
  name: string;

  @ApiProperty({ example: '900123456', description: 'Número de identificación tributaria' })
  @Expose()
  nit: string;

  @ApiProperty({ example: 7, description: 'Dígito de verificación del NIT' })
  @Expose()
  verificationDigit: number;

  @ApiProperty({ example: '+57 1 234 5678', description: 'Teléfono de contacto' })
  @Expose()
  phone: string;

  @ApiProperty({ example: 'contacto@migestorfinanciero.com', description: 'Email de contacto' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.', description: 'Dirección física' })
  @Expose()
  address: string;

  @ApiProperty({ example: 'logos/logo.png', description: 'Ruta del archivo de logo' })
  @Expose()
  logoUrl: string;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    description: 'Logo de la empresa en formato base64',
    required: false
  })
  @Expose()
  logoBase64: string | null;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z', description: 'Fecha de creación' })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T14:30:00.000Z', description: 'Fecha de última actualización' })
  @Expose()
  updatedAt: string;
}