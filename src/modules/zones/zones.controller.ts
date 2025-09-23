import { Controller, Get, UseGuards } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZoneListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseZoneDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('zones')
@ApiBearerAuth()
@Controller('zones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  // @Post()
  // create(@Body() createZoneDto: CreateZoneDto) {
  //   return this.zonesService.create(createZoneDto);
  // }

  @Get()
  @Permissions('view.zones')
  @ApiOperation({ 
    summary: 'Obtener zonas',
    description: 'Retorna una lista con todas las zonas geográficas disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de zonas obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de zonas',
          zones: [
            {
              id: 1,
              name: 'Norte',
              code: 'N',
              isActive: true,
            },
            {
              id: 2,
              name: 'Sur',
              code: 'S',
              isActive: true,
            },
            {
              id: 3,
              name: 'Centro',
              code: 'C',
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
          message: 'No tienes permisos para ver las zonas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-zones': {
        summary: 'No se encontraron zonas',
        value: {
          statusCode: 404,
          message: 'No se encontraron zonas disponibles',
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
          message: 'Error interno del servidor al obtener las zonas',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<ZoneListResponse> {
    const rawZones = await this.zonesService.findAll();
    const zones = plainToInstance(ResponseZoneDto, rawZones, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de zonas',
      zones,
    };
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.zonesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
//     return this.zonesService.update(+id, updateZoneDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.zonesService.remove(+id);
//   }
}
