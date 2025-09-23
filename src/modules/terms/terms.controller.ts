import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { TermsService } from './terms.service';
import { plainToInstance } from 'class-transformer';
import { TermListResponse } from './interfaces';
import { ResponseTermDto } from './dto';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

//   @Post()
//   create(@Body() createTermDto: CreateTermDto) {
//     return this.termsService.create(createTermDto);
//   }
// 
  @Get()
  @ApiOperation({ 
    summary: 'Listado de números de cuotas',
    description: 'Retorna una lista con todos los términos/plazos de cuotas disponibles en el sistema(Solo para créditos a cuotas fijas, no para créditos de intereses mensuales)'
  })
  @ApiOkResponse({
    description: 'Lista de términos obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Número de Cuotas',
          terms: [
            {
              id: 1,
              value: 12,
            },
            {
              id: 2,
              value: 24,
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
      'no-terms': {
        summary: 'No se encontraron términos',
        value: {
          statusCode: 404,
          message: 'No se encontraron términos disponibles',
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
  async findAll(): Promise <TermListResponse> {
    const rawTerms = await this.termsService.findAll();

    const terms = plainToInstance(ResponseTermDto, rawTerms, { excludeExtraneousValues: true });
    return { 
      customMessage: 'Número de Cuotas',
      terms 
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.termsService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateTermDto: UpdateTermDto) {
//     return this.termsService.update(+id, updateTermDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.termsService.remove(+id);
//   }
}
