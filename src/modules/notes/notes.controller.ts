import { Body, Controller, Get, Post, Param, Query, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, ResponseNoteDto } from './dto';
import { NoteResponse, NoteListResponse } from './interfaces/note-response.interface';
import { PaginationDto } from '@common/dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse,
  ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse,
  ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiParam,
  ApiQuery, ApiUnprocessableEntityResponse
} from '@nestjs/swagger';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('by-model/:model/:modelId')
  @Permissions('view.notes')
  @ApiOperation({
    summary: 'Obtener notas por modelo',
    description: 'Obtiene todas las notas asociadas a un modelo específico y su ID'
  })
  @ApiParam({
    name: 'model',
    description: 'Tipo de modelo',
    example: 'loan',
    enum: ['loan', 'customer', 'collector', 'payment', 'installment']
  })
  @ApiParam({
    name: 'modelId',
    description: 'ID del registro del modelo',
    example: 1
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({
    description: 'Notas obtenidas correctamente',
    examples: {
      'success': {
        summary: 'Notas del préstamo obtenidas',
        value: {
          customMessage: 'Notas del préstamo obtenidas correctamente',
          notes: [
            {
              id: 1,
              modelId: 1,
              model: 'loan',
              content: 'Cliente no se encontraba en casa.',
              createdBy: 2,
              createdAt: '2024-01-15T10:30:00.000Z',
              user: {
                id: 2,
                name: 'Carlos Cobrador',
                email: 'carlos.cobrador@migestor.com'
              }
            }
          ],
          meta: {
            total: 5,
            page: 1,
            lastPage: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron notas',
    examples: {
      'no-notes': {
        summary: 'No hay notas',
        value: {
          customMessage: 'No se encontraron notas para este registro',
          notes: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  async findByModel(
    @Param('model') model: string,
    @Param('modelId', ParseIntPipe) modelId: number,
    @Query() paginationDto: PaginationDto
  ): Promise<NoteListResponse> {
    const { notes, meta } = await this.notesService.findByModel(model, modelId, paginationDto);
    
    const notesResponse = plainToInstance(ResponseNoteDto, notes, { excludeExtraneousValues: true });
    
    const message = notes.length > 0 
      ? `Notas del ${model} obtenidas correctamente`
      : 'No se encontraron notas para este registro';
    
    return {
      customMessage: message,
      notes: notesResponse,
      meta
    };
  }

  @Post()
  @Permissions('create.notes')
  @ApiOperation({
    summary: 'Crear una nueva nota',
    description: 'Crea una nota asociada a cualquier modelo del sistema (préstamo, cliente, cobrador, etc.)'
  })
  @ApiBody({
    type: CreateNoteDto,
    description: 'Datos de la nota a crear',
    examples: {
      'nota-prestamo': {
        summary: 'Nota sobre préstamo',
        description: 'Ejemplo de nota sobre una novedad en un préstamo',
        value: {
          modelId: 1,
          model: 'loan',
          content: 'Cliente no se encontraba en casa. Se intentó cobro a las 10:00 AM. Vecinos indican que regresa por la tarde.'
        }
      },
      'nota-cliente': {
        summary: 'Nota sobre cliente',
        description: 'Ejemplo de nota sobre información del cliente',
        value: {
          modelId: 5,
          model: 'customer',
          content: 'Cliente cambió de dirección. Nueva dirección: Calle 123 #45-67. Actualizar en próxima visita.'
        }
      },
      'nota-pago': {
        summary: 'Nota sobre pago',
        description: 'Ejemplo de nota sobre una novedad en el pago',
        value: {
          modelId: 25,
          model: 'payment',
          content: 'Pago realizado en efectivo. Cliente solicitó recibo físico que se le entregó en el momento.'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Nota creada exitosamente',
    examples: {
      'success': {
        summary: 'Nota creada exitosamente',
        value: {
          customMessage: 'Nota creada correctamente',
          note: {
            id: 1,
            modelId: 1,
            model: 'loan',
            content: 'Cliente no se encontraba en casa. Se intentó cobro a las 10:00 AM.',
            createdBy: 2,
            createdAt: '2024-01-15T10:30:00.000Z',
            user: {
              id: 2,
              name: 'Carlos Cobrador',
              email: 'carlos.cobrador@migestor.com'
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o modelo no válido',
    examples: {
      'invalid-model': {
        summary: 'Modelo no válido',
        value: {
          statusCode: 400,
          message: 'Modelo "invalid" no es válido. Modelos permitidos: loan, customer, collector, payment, installment',
          error: 'Bad Request'
        }
      },
      'record-not-found': {
        summary: 'Registro no encontrado',
        value: {
          statusCode: 400,
          message: 'Registro con ID 999 no encontrado en el modelo loan',
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
            'El ID del modelo debe ser un número positivo',
            'El modelo es requerido',
            'El contenido debe tener al menos 5 caracteres'
          ],
          error: 'Unprocessable Entity'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permisos para crear notas',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear notas',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al crear la nota',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(@Body() createNoteDto: CreateNoteDto, @Req() req): Promise<NoteResponse> {
    const rawNote = await this.notesService.create(createNoteDto, req);
    const note = plainToInstance(ResponseNoteDto, rawNote, { excludeExtraneousValues: true });
    
    return {
      customMessage: 'Nota creada correctamente',
      note
    };
  }

  @Get()
  @Permissions('view.notes')
  @ApiOperation({
    summary: 'Obtener todas las notas (admin)',
    description: 'Obtiene todas las notas del sistema (solo para administradores)'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAll(@Query() paginationDto: PaginationDto): Promise<NoteListResponse> {
    const { notes, meta } = await this.notesService.findAll(paginationDto);
    
    const notesResponse = plainToInstance(ResponseNoteDto, notes, { excludeExtraneousValues: true });
    
    return {
      customMessage: 'Todas las notas obtenidas correctamente',
      notes: notesResponse,
      meta
    };
  }

  @Get(':id')
  @Permissions('view.notes')
  @ApiOperation({
    summary: 'Obtener nota por ID',
    description: 'Obtiene una nota específica por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID de la nota', example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NoteResponse> {
    const rawNote = await this.notesService.findOne(id);
    const note = plainToInstance(ResponseNoteDto, rawNote, { excludeExtraneousValues: true });
    
    return {
      customMessage: 'Nota obtenida correctamente',
      note
    };
  }

}
