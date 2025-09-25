// docs.controller.ts
import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { TemplatesService } from './templates.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('import-customers')
  @Permissions('download.templates')
  @ApiOperation({
    summary: 'Descargar plantilla de importación de clientes',
    description:
      'Descarga un archivo Excel (.xlsx) con la plantilla para importar clientes en lote. El archivo contiene las columnas requeridas y ejemplos de datos.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'Plantilla descargada exitosamente',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel con plantilla de importación de clientes',
        },
        examples: {
          'template-file': {
            summary: 'Archivo de plantilla',
            description:
              'El archivo Excel contiene columnas como: firstName, lastName, documentNumber, email, phone, etc.',
            value: 'Binary Excel file content',
          },
        },
      },
    },
    headers: {
      'Content-Disposition': {
        description: 'Nombre del archivo a descargar',
        schema: {
          type: 'string',
          example: 'attachment; filename="import_customers_template.xlsx"',
        },
      },
      'Content-Type': {
        description: 'Tipo de contenido del archivo',
        schema: {
          type: 'string',
          example:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized',
        },
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Sin permisos para descargar plantillas',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para descargar plantillas',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para descargar plantillas',
          error: 'Forbidden',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'file-generation-error': {
        summary: 'Error al generar archivo',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al generar la plantilla',
          error: 'Internal Server Error',
        },
      },
      'stream-error': {
        summary: 'Error de streaming',
        value: {
          statusCode: 500,
          message: 'Error al enviar el archivo',
          error: 'Internal Server Error',
        },
      },
    },
  })
  async downloadTemplate(@Res() res: Response) {
    const { stream } = this.templatesService.getCustomerTemplateFile();

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="import_customers_template.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    stream.pipe(res);
  }
}
