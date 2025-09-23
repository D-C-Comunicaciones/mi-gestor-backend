import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GendersService } from './genders.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { custom } from 'joi';
import { plainToInstance } from 'class-transformer';
import { GendersListResponse } from './interfaces';
import { ResponseGenderDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('genders')
@ApiBearerAuth()
@Controller('genders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  // @Post()
  // create(@Body() createGenderDto: CreateGenderDto) {
  //   return this.gendersService.create(createGenderDto);
  // }

  @Get()
  @Permissions('view.genders')
  @ApiOperation({ 
    summary: 'Obtener géneros',
    description: 'Retorna una lista con todos los géneros disponibles en el sistema'
  })
  @ApiOkResponse({
    description: 'Lista de géneros obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de géneros',
          genders: [
            {
              id: 1,
              name: 'Masculino',
              code: 'M',
              isActive: true,
            },
            {
              id: 2,
              name: 'Femenino',
              code: 'F',
              isActive: true,
            },
            {
              id: 3,
              name: 'Otro',
              code: 'O',
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
          message: 'No tienes permisos para ver los géneros',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-genders': {
        summary: 'No se encontraron géneros',
        value: {
          statusCode: 404,
          message: 'No se encontraron géneros disponibles',
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
          message: 'Error interno del servidor al obtener los géneros',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<GendersListResponse> {
    const rawGenders = await this.gendersService.findAll();
    const genders = plainToInstance(
      ResponseGenderDto,
      rawGenders,
      { excludeExtraneousValues: true }
    );

    return {
      customMessage: 'Listado de géneros',
      genders
    };
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gendersService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGenderDto: UpdateGenderDto) {
//     return this.gendersService.update(+id, updateGenderDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gendersService.remove(+id);
//   }
}
