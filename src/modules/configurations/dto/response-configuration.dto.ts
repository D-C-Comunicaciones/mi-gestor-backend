import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns/format';

/**
 * DTO para la respuesta de configuración del sistema
 * Contiene la configuración completa con detalles de moneda y zona horaria
 * Utilizado para mostrar la configuración actual del sistema
 */
export class ResponseConfigurationDto {
  @ApiProperty({
    description: 'Identificador único de la configuración',
    example: 1,
    type: 'integer'
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ID de la moneda configurada',
    example: 1,
    type: 'integer'
  })
  @Expose()
  currencyId: number;

  @ApiProperty({
    description: 'Nombre completo de la moneda',
    example: 'Peso Colombiano',
    type: 'string'
  })
  @Expose()
  currencyName: string;

  @ApiProperty({
    description: 'Código ISO de la moneda',
    example: 'COP',
    type: 'string'
  })
  @Expose()
  currencyCode: string;

  @ApiProperty({
    description: 'Símbolo de la moneda',
    example: '$',
    type: 'string'
  })
  @Expose()
  currencySymbol: string;

  @ApiProperty({
    description: 'ID de la zona horaria configurada',
    example: 1,
    type: 'integer'
  })
  @Expose()
  timezoneId: number;
  
  @ApiProperty({
    description: 'Nombre de la zona horaria',
    example: 'America/Bogota',
    type: 'string'
  })
  @Expose()
  timeZoneName: string;

  @ApiProperty({
    description: 'Offset UTC de la zona horaria',
    example: '-05:00',
    type: 'string'
  })
  @Expose()
  timeZoneOffset: string;

  @ApiProperty({
    description: 'Paleta de colores del sistema',
    example: '#FFFFFF,#000000,#007BFF',
    type: 'string'
  })
  @Expose()
  colorPalette: string;

  @ApiProperty({
    description: 'Fecha de creación de la configuración',
    example: '2024-01-01 10:00:00',
    type: 'string'
  })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización de la configuración',
    example: '2024-01-01 10:00:00',
    type: 'string'
  })
  @Expose()
  @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
  updatedAt: Date;
}
