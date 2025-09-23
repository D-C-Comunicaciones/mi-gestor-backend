import { Controller, Get, UseGuards } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { plainToInstance } from 'class-transformer';
import { ResponseLoantypeDto } from './dto';
import { LoanTypeListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('loanTypes')
@ApiBearerAuth()
@Controller('loan-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoanTypesController {
  constructor(private readonly loanTypesService: LoanTypesService) {}

  // @Post()
  // create(@Body() createLoanTypeDto: CreateLoanTypeDto) {
  //   return this.loanTypesService.create(createLoanTypeDto);
  // }

  @Get()
  @Permissions('view.loan-types')
  @ApiOperation({ 
    summary: 'Obtener tipos de crédito',
    description: 'Retorna una lista con todos los tipos de crédito disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de tipos de crédito obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de tipos de crédito',
          loanTypes: [
            {
              id: 1,
              name: 'Cuotas fijas',
              isActive: true,
            },
            {
              id: 2,
              name: 'Intereses Mensuales',
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
          message: 'No tienes permisos para ver los tipos de crédito',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-loan-types': {
        summary: 'No se encontraron tipos de crédito',
        value: {
          statusCode: 404,
          message: 'No se encontraron tipos de crédito disponibles',
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
          message: 'Error interno del servidor al obtener los tipos de crédito',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<LoanTypeListResponse> {
    const rawLoanTypes = await this.loanTypesService.findAll();
    const loanTypes = plainToInstance(ResponseLoantypeDto, rawLoanTypes, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de tipos de crédito',
      loanTypes
    }
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.loanTypesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateLoanTypeDto: UpdateLoanTypeDto) {
//     return this.loanTypesService.update(+id, updateLoanTypeDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.loanTypesService.remove(+id);
//   }
}
