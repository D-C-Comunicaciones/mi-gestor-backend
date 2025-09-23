import { Controller, Post, Body, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiParam, ApiBody, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema con los datos proporcionados'
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos del usuario a crear',
    examples: {
      'usuario-basico': {
        summary: 'Usuario básico',
        description: 'Ejemplo de usuario con información mínima',
        value: {
          email: 'juan.perez@ejemplo.com',
          name: 'Juan Pérez',
          password: 'password123'
        }
      },
      'usuario-completo': {
        summary: 'Usuario completo',
        description: 'Ejemplo de usuario con toda la información',
        value: {
          email: 'maria.garcia@ejemplo.com',
          name: 'María García López',
          password: 'mySecurePassword456',
          phone: '+57 300 123 4567'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    examples: {
      'success': {
        summary: 'Usuario creado exitosamente',
        value: {
          id: 1,
          email: 'juan.perez@ejemplo.com',
          name: 'Juan Pérez',
          phone: '+57 300 123 4567',
          createdAt: '2024-01-15T10:30:00.000Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'email debe ser un email válido',
            'name no debe estar vacío',
            'password debe tener al menos 6 caracteres'
          ],
          error: 'Bad Request'
        }
      },
      'duplicate-email': {
        summary: 'Email ya existe',
        value: {
          statusCode: 400,
          message: 'El email ya está registrado en el sistema',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Errores de validación',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'email debe ser un email válido',
            'name no debe estar vacío',
            'password debe tener al menos 6 caracteres'
          ],
          error: 'Unprocessable Entity'
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
        summary: 'Sin permisos para crear usuarios',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear usuarios',
          error: 'Forbidden'
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
          message: 'Error interno del servidor al crear el usuario',
          error: 'Internal Server Error'
        }
      }
    }
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description: 'Retorna una lista con todos los usuarios del sistema'
  })
  @ApiOkResponse({
    description: 'Lista de usuarios obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: [
          {
            id: 1,
            email: 'juan.perez@ejemplo.com',
            name: 'Juan Pérez',
            phone: '+57 300 123 4567',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          },
          {
            id: 2,
            email: 'maria.garcia@ejemplo.com',
            name: 'María García',
            phone: '+57 300 987 6543',
            createdAt: '2024-01-16T11:30:00.000Z',
            updatedAt: '2024-01-21T15:45:00.000Z'
          }
        ]
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
        summary: 'Sin permisos para ver usuarios',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los usuarios',
          error: 'Forbidden'
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
          message: 'Error interno del servidor al obtener los usuarios',
          error: 'Internal Server Error'
        }
      }
    }
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un usuario por ID',
    description: 'Retorna los datos de un usuario específico basado en su ID'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del usuario',
    example: 1
  })
  @ApiOkResponse({
    description: 'Usuario encontrado exitosamente',
    examples: {
      'success': {
        summary: 'Usuario encontrado',
        value: {
          id: 1,
          email: 'juan.perez@ejemplo.com',
          name: 'Juan Pérez',
          phone: '+57 300 123 4567',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
    examples: {
      'invalid-id': {
        summary: 'ID inválido',
        value: {
          statusCode: 400,
          message: 'El ID debe ser un número válido',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
    examples: {
      'user-not-found': {
        summary: 'Usuario no encontrado',
        value: {
          statusCode: 404,
          message: 'Usuario con ID 1 no encontrado',
          error: 'Not Found'
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
        summary: 'Sin permisos para ver usuario',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver este usuario',
          error: 'Forbidden'
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
          message: 'Error interno del servidor al obtener el usuario',
          error: 'Internal Server Error'
        }
      }
    }
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description: 'Actualiza los datos de un usuario existente'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del usuario a actualizar',
    example: 1
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Datos del usuario a actualizar (campos opcionales)',
    examples: {
      'actualizar-email': {
        summary: 'Actualizar solo email',
        description: 'Ejemplo actualizando únicamente el email',
        value: {
          email: 'nuevo.email@ejemplo.com'
        }
      },
      'actualizar-completo': {
        summary: 'Actualización completa',
        description: 'Ejemplo actualizando múltiples campos',
        value: {
          email: 'usuario.actualizado@ejemplo.com',
          name: 'Juan Pérez Actualizado',
          phone: '+57 300 987 6543'
        }
      },
      'cambiar-password': {
        summary: 'Cambiar contraseña',
        description: 'Ejemplo cambiando solo la contraseña',
        value: {
          password: 'newSecurePassword789'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Usuario actualizado exitosamente',
    examples: {
      'success': {
        summary: 'Usuario actualizado exitosamente',
        value: {
          id: 1,
          email: 'usuario.actualizado@ejemplo.com',
          name: 'Juan Pérez Actualizado',
          phone: '+57 300 987 6543',
          updatedAt: '2024-01-20T14:45:00.000Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o ID inválido',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'email debe ser un email válido',
            'El ID debe ser un número válido'
          ],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
    examples: {
      'user-not-found': {
        summary: 'Usuario no encontrado',
        value: {
          statusCode: 404,
          message: 'Usuario con ID 1 no encontrado',
          error: 'Not Found'
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
        summary: 'Sin permisos para actualizar usuario',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para actualizar este usuario',
          error: 'Forbidden'
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
          message: 'Error interno del servidor al actualizar el usuario',
          error: 'Internal Server Error'
        }
      }
    }
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

}
