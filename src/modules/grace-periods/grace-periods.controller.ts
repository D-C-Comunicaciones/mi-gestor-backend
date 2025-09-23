import { Controller, Get, UseGuards } from '@nestjs/common';
import { GracePeriodsService } from './grace-periods.service';
import { plainToInstance } from 'class-transformer';
import { ResponseGracePeriodDto } from './dto';
import { GracePeriodListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('gracePeriods')
@ApiBearerAuth()
@Controller('grace-periods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GracePeriodsController {
  constructor(private readonly gracePeriodsService: GracePeriodsService) {}

//   @Post()
//   create(@Body() createGracePeriodDto: CreateGracePeriodDto) {
//     return this.gracePeriodsService.create(createGracePeriodDto);
//   }
// 
  @Get()
  @Permissions('view.grace-periods')
  @ApiOperation({ 
    summary: 'Obtener periodos de gracia',
    description: 'Retorna una lista con todos los periodos de gracia disponibles en el sistema para aplicar solo a créditos con pagos de intereses mensuales.'
  })
  @ApiOkResponse({
    description: 'Lista de periodos de gracia obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Lista de periodos de gracia',
          gracePeriods: [
            {
              id: 1,
              name: '15 días',
              days: 15
            },
            {
              id: 2,
              name: '1 mes',
              days: 30
            },
            {
              id: 3,
              name: '2 meses',
              days: 60
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
        summary: 'Sin permisos para ver periodos de gracia',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los periodos de gracia',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-grace-periods': {
        summary: 'No se encontraron periodos de gracia',
        value: {
          statusCode: 404,
          message: 'No se encontraron periodos de gracia disponibles',
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
          message: 'Error interno del servidor al obtener los periodos de gracia',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<GracePeriodListResponse> {
    const rawgracePeriods = await this.gracePeriodsService.findAll();

    const gracePeriods = plainToInstance(ResponseGracePeriodDto, rawgracePeriods, { excludeExtraneousValues: true });
    return {
      customMessage: 'Lista de periodos de gracia',
      gracePeriods
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gracePeriodsService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGracePeriodDto: UpdateGracePeriodDto) {
//     return this.gracePeriodsService.update(+id, updateGracePeriodDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gracePeriodsService.remove(+id);
//   }
}
