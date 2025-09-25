import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { TypeDocumentIdentificationsService } from './type-document-identifications.service';
import { TypeDocumentIdentificationListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseTypeDocumentIdentificationDto } from './dto';

@ApiTags('typeDocumentIdentifications')
@Controller('type-document-identifications')
export class TypeDocumentIdentificationsController {
  constructor(private readonly typeDocumentIdentificationsService: TypeDocumentIdentificationsService) { }

  // @Post()
  // create(@Body() createTypeDocumentIdentificationDto: CreateTypeDocumentIdentificationDto) {
  //   return this.typeDocumentIdentificationsService.create(createTypeDocumentIdentificationDto);
  // }

  @Get()
  @ApiOperation({ 
    summary: 'Listar tipos de documentos de identificación',
    description: 'Retorna una lista con todos los tipos de documentos de identificación disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de tipos de documentos de identificación obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de tipos de documentos de identificación',
          typeDocumentIdentifications: [
            {
              id: 1,
              name: 'Cédula de Ciudadanía',
              code: 'CC',
              isActive: true,
            },
            {
              id: 2,
              name: 'Cédula de Extranjería',
              code: 'CE',
              isActive: true,
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Solicitud incorrecta - Parámetros inválidos',
    examples: {
      'invalid-params': {
        summary: 'Parámetros inválidos',
        value: {
          statusCode: 400,
          message: ['El parámetro proporcionado no es válido'],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Permisos insuficientes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para acceder al recurso',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para acceder a este recurso',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-documents': {
        summary: 'No se encontraron tipos de documentos',
        value: {
          statusCode: 404,
          message: 'No se encontraron tipos de documentos de identificación',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al procesar la solicitud',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<TypeDocumentIdentificationListResponse> {
    const rawTypeDocumentIdentifications = await this.typeDocumentIdentificationsService.findAll();
    const typeDocumentIdentifications = plainToInstance(
      ResponseTypeDocumentIdentificationDto,
      rawTypeDocumentIdentifications
    );

    return {
      customMessage: 'Listado de tipos de documentos de identificación',
      typeDocumentIdentifications
    };
  }

  //   @Get(':id')
  //   findOne(@Param('id') id: string) {
  //     return this.typeDocumentIdentificationsService.findOne(+id);
  //   }
  // 
  //   @Patch(':id')
  //   update(@Param('id') id: string, @Body() updateTypeDocumentIdentificationDto: UpdateTypeDocumentIdentificationDto) {
  //     return this.typeDocumentIdentificationsService.update(+id, updateTypeDocumentIdentificationDto);
  //   }
  // 
  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.typeDocumentIdentificationsService.remove(+id);
  //   }
}
