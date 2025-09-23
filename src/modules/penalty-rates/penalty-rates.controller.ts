import { Controller, Get, UseGuards } from '@nestjs/common';
import { PenaltyRatesService } from './penalty-rates.service';
import { plainToInstance } from 'class-transformer';
import { ResponsePenaltyRateDto } from './dto';
import { PenaltyRateListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('penaltyRates')
@ApiBearerAuth()
@Controller('penalty-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PenaltyRatesController {
  constructor(private readonly penaltyRatesService: PenaltyRatesService) {}

//   @Post()
//   create(@Body() createPenaltyRateDto: CreatePenaltyRateDto) {
//     return this.penaltyRatesService.create(createPenaltyRateDto);
//   }
// 
  @Get()
  @Permissions('view.penalty-rates')
  @ApiOperation({ 
    summary: 'Obtener tasas de penalización',
    description: 'Retorna una lista con todas las tasas de penalización disponibles en el sistema para moratorias'
  })
  @ApiOkResponse({
    description: 'Lista de tasas de penalización obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Lista de tasas de penalización',
          penaltyRates: [
            {
              id: 1,
              name: 'Mora legal máxima',
              value: 0.05
            },
            {
              id: 2,
              name: 'Mora estándar',
              value: 0.03
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
        summary: 'Sin permisos para ver tasas de penalización',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver las tasas de penalización',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-penalty-rates': {
        summary: 'No se encontraron tasas de penalización',
        value: {
          statusCode: 404,
          message: 'No se encontraron tasas de penalización disponibles',
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
          message: 'Error interno del servidor al obtener las tasas de penalización',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<PenaltyRateListResponse> {
    const rawPenaltyRates = await this.penaltyRatesService.findAll();

    const penaltyRates = plainToInstance(ResponsePenaltyRateDto, rawPenaltyRates, { excludeExtraneousValues: true });

    return {
      customMessage: 'Lista de tasas de penalización',
      penaltyRates,
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.penaltyRatesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePenaltyRateDto: UpdatePenaltyRateDto) {
//     return this.penaltyRatesService.update(+id, updatePenaltyRateDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.penaltyRatesService.remove(+id);
//   }
}
