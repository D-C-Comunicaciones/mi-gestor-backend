import { Controller, Get, UseGuards } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { plainToInstance } from 'class-transformer';
import { ResponseInterestRateDto } from './dto';
import { InterestRateListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('interestRates')
@ApiBearerAuth()
@Controller('interest-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

//   @Post()
//   create(@Body() createInterestRateDto: CreateInterestRateDto) {
//     return this.interestRatesService.create(createInterestRateDto);
//   }
// 
  @Get()
  @Permissions('view.interest-rates')
  @ApiOperation({ 
    summary: 'Obtener tasas de interés',
    description: 'Retorna una lista con todas las tasas de interés corriente disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de tasas de interés obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Tasas de Interés corriente',
          interestRates: [
            {
              id: 1,
              value: 10,
              name: '10%',
            },
            {
              id: 2,
              value: 12.0,
              name: '12',
            },
            {
              id: 3,
              value: 15.0,
              name: '15%',
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
          message: 'No tienes permisos para ver las tasas de interés',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-interest-rates': {
        summary: 'No se encontraron tasas de interés',
        value: {
          statusCode: 404,
          message: 'No se encontraron tasas de interés disponibles',
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
          message: 'Error interno del servidor al obtener las tasas de interés',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<InterestRateListResponse> {
    const rawInterestRate = await this.interestRatesService.findAll();

    const interestRates = plainToInstance(ResponseInterestRateDto, rawInterestRate, { excludeExtraneousValues: true });

    return { 
      customMessage: 'Tasas de Interés corriente',
      interestRates 
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.interestRatesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateInterestRateDto: UpdateInterestRateDto) {
//     return this.interestRatesService.update(+id, updateInterestRateDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.interestRatesService.remove(+id);
//   }
}
