import { Controller, Get, Post, Body, Patch, Param, HttpStatus, Query, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UpdateCollectionRouteDto, ChangeStatusCollectionRouteDto, CreateCollectionRouteDto } from './dto';
import { AssignCustomersToRouteDto } from './dto/assign-customers-to-route.dto';
import { AssignCollectorToRouteDto } from './dto/assign-collector-to-route.dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { CollectionRoutesPaginationDto, ResponseCollectionRouteDto } from './dto';
import { CollectionRoutesService } from './collection-routes.service';
import { BulkAssignCollectorsDto } from './dto/bulk-assign-collectors.dto';
import { BulkAssignCustomersDto } from './dto/bulk-assign-customers.dto';

@ApiTags('collectionRoutes')

@Controller('collection-routes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionRoutesController {
  constructor(private readonly collectionRoutesService: CollectionRoutesService) {}

  @Post()
  @Permissions('create.collection-routes')
  @ApiOperation({ 
    summary: 'Crear una nueva ruta de cobranza',
    description: `
    Crea una nueva ruta de cobranza en el sistema.
    
    **Funcionalidad:**
    - Permite crear rutas con o sin cobrador asignado
    - Valida que el nombre de la ruta sea único
    - Si se asigna un cobrador, valida que exista y esté activo
    
    **Respuesta exitosa:** Retorna la ruta creada con información del cobrador (si aplica)
    `
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Ruta de cobranza creada exitosamente',
    schema: {
      example: {
        message: "Ruta de cobranza creada exitosamente",
        code: 201,
        status: "success",
        data: {
          customMessage: "Ruta de cobranza creada exitosamente",
          route: {
            id: 1,
            collectorId: 1,
            name: "Ruta Centro Norte",
            isActive: true,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
            createdBy: 1,
            collector: {
              id: 1,
              firstName: "Juan",
              lastName: "Pérez",
              phone: "123456789"
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Error de validación - Nombre duplicado o cobrador no encontrado',
    schema: {
      example: {
        message: "Ya existe una ruta con el nombre \"Ruta Centro Norte\"",
        code: 400,
        status: "error"
      }
    }
  })
  @ApiBody({ 
    type: CreateCollectionRouteDto,
    examples: {
      conCobrador: {
        summary: "Ruta con cobrador asignado",
        value: {
          name: "Ruta Centro Norte",
          collectorId: 1
        }
      },
      sinCobrador: {
        summary: "Ruta sin cobrador",
        value: {
          name: "Ruta Sin Asignar"
        }
      }
    }
  })
  async create(@Body() createCollectionRouteDto: CreateCollectionRouteDto, @Req() req) {
    const rawRoute = await this.collectionRoutesService.create(createCollectionRouteDto, req);
    const route = plainToInstance(ResponseCollectionRouteDto, rawRoute);
    return {
      customMessage: 'Ruta de cobranza creada exitosamente',
      route
    };
  }

  @Get()
  @Permissions('view.collection-routes')
  @ApiOperation({ 
    summary: 'Obtener todas las rutas de cobranza con paginación',
    description: `
    Retorna una lista paginada de rutas de cobranza con filtros opcionales.
    
    **Filtros disponibles:**
    - \`isActive\`: Filtrar por estado activo/inactivo
    - \`page\`: Número de página (default: 1)
    - \`limit\`: Cantidad por página (default: 10)
    
    **Casos de respuesta:**
    - **Datos encontrados:** Lista de rutas con metadata de paginación
    - **Sin datos:** Array vacío con mensaje informativo
    `
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Registros por página (default: 10)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por estado activo/inactivo' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de rutas obtenida exitosamente',
    schema: {
      example: {
        message: "Rutas de cobranza obtenidas exitosamente",
        code: 200,
        status: "success",
        data: {
          customMessage: "Rutas de cobranza obtenidas exitosamente",
          routes: [{
            id: 1,
            collectorId: 1,
            name: "Ruta Centro Norte",
            isActive: true,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
            createdBy: 1,
            collector: {
              id: 1,
              firstName: "Juan",
              lastName: "Pérez",
              phone: "123456789"
            }
          }],
          meta: {
            total: 25,
            page: 1,
            lastPage: 3,
            limit: 10,
            hasNextPage: true
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sin datos encontrados',
    schema: {
      example: {
        message: "No se encontraron rutas de cobranza con los parámetros proporcionados",
        code: 200,
        status: "success",
        data: {
          customMessage: "No se encontraron rutas de cobranza con los parámetros proporcionados",
          routes: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false
          }
        }
      }
    }
  })
  async findAll(@Query() paginationDto: CollectionRoutesPaginationDto) {
    const { rawCollectionRoutes, meta } = await this.collectionRoutesService.findAll(paginationDto);
    
    if (rawCollectionRoutes.length === 0) {
      return {
        customMessage: 'No se encontraron rutas de cobranza con los parámetros proporcionados',
        routes: [],
        meta
      };
    }

    const routes = plainToInstance(ResponseCollectionRouteDto, rawCollectionRoutes);
    return {
      customMessage: 'Rutas de cobranza obtenidas exitosamente',
      routes,
      meta
    };
  }

  @Get('unassigned')
  @Permissions('view.collection-routes')
  @ApiOperation({ 
    summary: 'Obtener rutas sin cobrador asignado',
    description: `
    Retorna todas las rutas activas que no tienen cobrador asignado.
    
    **Funcionalidad:**
    - Solo muestra rutas activas (\`isActive: true\`)
    - Solo rutas con \`collectorId: null\`
    - Ordenadas por fecha de creación (más recientes primero)
    
    **Casos de respuesta:**
    - **Con datos:** Lista de rutas sin asignar
    - **Sin datos:** Array vacío con mensaje informativo
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rutas sin asignar encontradas',
    schema: {
      example: {
        message: "Rutas sin asignar obtenidas exitosamente",
        code: 200,
        status: "success",
        data: {
          customMessage: "Rutas sin asignar obtenidas exitosamente",
          routes: [{
            id: 1,
            collectorId: null,
            name: "Ruta Centro Norte",
            isActive: true,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
            createdBy: 1,
            collector: null
          }]
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'No hay rutas sin asignar',
    schema: {
      example: {
        message: "No se encontraron rutas sin asignar",
        code: 200,
        status: "success",
        data: {
          customMessage: "No se encontraron rutas sin asignar",
          routes: []
        }
      }
    }
  })
  async findUnassigned() {
    const rawRoutes = await this.collectionRoutesService.findUnassigned();
    
    if (rawRoutes.length === 0) {
      return {
        customMessage: 'No se encontraron rutas sin asignar',
        routes: []
      };
    }

    const routes = plainToInstance(ResponseCollectionRouteDto, rawRoutes);
    return {
      customMessage: 'Rutas sin asignar obtenidas exitosamente',
      routes
    };
  }

  @Get('collector/:collectorId')
  @Permissions('view.collection-routes')
  @ApiOperation({ 
    summary: 'Obtener rutas asignadas a un cobrador específico',
    description: `
    Retorna todas las rutas asignadas a un cobrador.
    
    **Funcionalidad:**
    - Valida que el cobrador exista
    - Retorna todas las rutas del cobrador (activas e inactivas)
    - Incluye información completa del cobrador
    
    **Casos de respuesta:**
    - **Con rutas:** Lista de rutas del cobrador
    - **Sin rutas:** Array vacío (cobrador existe pero sin rutas)
    - **Error 404:** Cobrador no encontrado
    `
  })
  @ApiParam({ name: 'collectorId', description: 'ID del cobrador', type: Number, example: 1 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rutas del cobrador encontradas',
    schema: {
      example: {
        message: "Rutas del cobrador obtenidas exitosamente",
        code: 200,
        status: "success",
        data: {
          customMessage: "Rutas del cobrador obtenidas exitosamente",
          routes: [{
            id: 1,
            collectorId: 1,
            name: "Ruta Centro Norte",
            isActive: true,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
            createdBy: 1,
            collector: {
              id: 1,
              firstName: "Juan",
              lastName: "Pérez",
              phone: "123456789"
            }
          }]
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cobrador sin rutas asignadas',
    schema: {
      example: {
        message: "No se encontraron rutas asignadas a este cobrador",
        code: 200,
        status: "success",
        data: {
          customMessage: "No se encontraron rutas asignadas a este cobrador",
          routes: []
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Cobrador no encontrado',
    schema: {
      example: {
        message: "Cobrador con ID 999 no encontrado",
        code: 404,
        status: "error"
      }
    }
  })
  async findByCollector(@Param('collectorId') collectorId: string) {
    const rawRoutes = await this.collectionRoutesService.findByCollector(+collectorId);
    
    if (rawRoutes.length === 0) {
      return {
        customMessage: 'No se encontraron rutas asignadas a este cobrador',
        routes: []
      };
    }

    const routes = plainToInstance(ResponseCollectionRouteDto, rawRoutes);
    return {
      customMessage: 'Rutas del cobrador obtenidas exitosamente',
      routes
    };
  }

  @Get(':id')
  @Permissions('view.collection-routes')
  @ApiOperation({ 
    summary: 'Obtener una ruta de cobranza por ID',
    description: 'Retorna los detalles de una ruta de cobranza específica incluyendo información del cobrador'
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta de cobranza', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Ruta de cobranza encontrada exitosamente',
    schema: {
      example: {
        id: 1,
        collectorId: 1,
        name: 'Ruta Centro - Zona 1',
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 1,
        collector: {
          id: 1,
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '123456789'
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ruta de cobranza no encontrada' })
  async findOne(@Param('id') id: string) {
    const rawCollectionRoute = await this.collectionRoutesService.findOne(+id);
    const collectionRoute = plainToInstance(ResponseCollectionRouteDto, rawCollectionRoute);
    return {
      customMessage: 'Ruta de cobranza obtenida exitosamente',
      collectionRoute
    };
  }

  @Patch(':id')
  @Permissions('update.collection-routes')
  @ApiOperation({ 
    summary: 'Actualizar una ruta de cobranza',
    description: 'Actualiza los datos de una ruta de cobranza existente'
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta de cobranza', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Ruta de cobranza actualizada exitosamente'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ruta de cobranza no encontrada' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: UpdateCollectionRouteDto })
  async update(@Param('id') id: string, @Body() updateCollectionRouteDto: UpdateCollectionRouteDto) {
    const rawRoute = await this.collectionRoutesService.update(+id, updateCollectionRouteDto);
    const route = plainToInstance(ResponseCollectionRouteDto, rawRoute);
    return {
      customMessage: 'Ruta de cobranza actualizada exitosamente',
      route
    };
  }

  @Patch(':id/status')
  @Permissions('update.collection-routes')
  @ApiOperation({ 
    summary: 'Cambiar estado de una ruta de cobranza',
    description: 'Activa o desactiva una ruta de cobranza específica'
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta de cobranza', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estado de la ruta cambiado exitosamente',
    schema: {
      example: {
        id: 1,
        isActive: false,
        message: 'Estado de la ruta actualizado exitosamente'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ruta de cobranza no encontrada' })
  @ApiBody({ type: ChangeStatusCollectionRouteDto })
  async changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusCollectionRouteDto) {
    const result = await this.collectionRoutesService.changeStatus(+id, changeStatusDto.isActive);
    return {
      customMessage: 'Estado de la ruta actualizado exitosamente',
      result
    };
  }

  @Post('assign-customers')
  @HttpCode(200)
  @Permissions('assign.customers-to-routes')
  @ApiOperation({ 
    summary: 'Asignar múltiples clientes a una ruta específica',
    description: `
    Asigna varios clientes a una ruta de cobranza específica.
    
    **Funcionalidad:**
    - Valida que la ruta exista y esté activa
    - Valida que todos los clientes existan y estén activos
    - Reasigna clientes que ya estén en otras rutas
    - Procesa solo clientes que necesiten cambios
    
    **Casos de respuesta:**
    - **200:** Asignaciones exitosas (total o parcial)
    - **409:** Todos los clientes ya estaban asignados a la ruta
    - **400:** Datos inválidos o ruta inactiva
    - **404:** Ruta o clientes no encontrados
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asignaciones procesadas exitosamente',
    schema: {
      example: {
        message: "Se asignaron algunos clientes, otros ya se encontraban asignados a la ruta \"Ruta Centro Norte\"",
        code: 200,
        status: "success",
        data: {
          customMessage: "Se asignaron algunos clientes, otros ya se encontraban asignados a la ruta \"Ruta Centro Norte\"",
          result: {
            success: true,
            route: {
              id: 1,
              name: "Ruta Centro Norte",
              collector: {
                id: 1,
                firstName: "Juan",
                lastName: "Pérez",
                phone: "123456789"
              }
            },
            summary: {
              totalProcessed: 5,
              totalAssigned: 3,
              totalReassigned: 2,
              totalNewAssignments: 1,
              alreadyAssigned: 2
            },
            assignedCustomers: [{
              id: 1,
              name: "María García",
              documentNumber: "12345678",
              previousRouteId: 2,
              newRouteId: 1,
              action: "Reasignado"
            }],
            warnings: []
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Todos los clientes ya estaban asignados',
    schema: {
      example: {
        message: "Todos los clientes ya están asignados a la ruta \"Ruta Centro Norte\"",
        code: 409,
        status: "success",
        data: {
          customMessage: "Todos los clientes ya están asignados a la ruta \"Ruta Centro Norte\"",
          result: {
            success: true,
            summary: {
              totalProcessed: 3,
              totalAssigned: 0,
              totalReassigned: 0,
              totalNewAssignments: 0,
              alreadyAssigned: 3
            }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: AssignCustomersToRouteDto,
    examples: {
      asignacionSimple: {
        summary: "Asignar múltiples clientes a una ruta",
        value: {
          collectionRouteId: 1,
          customerIds: [1, 2, 3, 4, 5]
        }
      }
    }
  })
  async assignCustomersToRoute(@Body() assignCustomersDto: AssignCustomersToRouteDto, @Req() req) {
    const result = await this.collectionRoutesService.assignCustomersToRoute(assignCustomersDto);
    
    // Establecer el código de estado HTTP basado en el resultado
    if (result.statusCode === 409) {
      req.res.status(409);
    }

    return {
      customMessage: result.message,
      result: {
        success: result.success,
        route: result.route,
        summary: result.summary,
        assignedCustomers: result.assignedCustomers,
        warnings: result.warnings
      }
    };
  }

  @Post(':id/assign-collector')
  @HttpCode(200)
  @Permissions('assign.collector-to-route')
  @ApiOperation({ 
    summary: 'Asignar un cobrador a una ruta específica',
    description: `
    Asigna un cobrador a una ruta de cobranza.
    
    **Funcionalidad:**
    - Valida que la ruta exista y esté activa
    - Valida que el cobrador exista y esté activo
    - Distingue entre asignación nueva y reasignación
    - Maneja casos donde el cobrador ya está asignado
    
    **Casos de respuesta:**
    - **200:** Asignación exitosa (nueva o reasignación)
    - **409:** El cobrador ya estaba asignado a esta ruta
    - **400:** Ruta o cobrador inactivo
    - **404:** Ruta o cobrador no encontrado
    `
  })
  @ApiParam({ name: 'id', description: 'ID de la ruta de cobranza', type: Number, example: 1 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cobrador asignado exitosamente',
    schema: {
      example: {
        message: "Cobrador asignado exitosamente. La ruta \"Ruta Centro Norte\" ahora está asignada a \"Juan Pérez\"",
        code: 200,
        status: "success",
        data: {
          customMessage: "Cobrador asignado exitosamente. La ruta \"Ruta Centro Norte\" ahora está asignada a \"Juan Pérez\"",
          result: {
            success: true,
            route: {
              id: 1,
              name: "Ruta Centro Norte",
              collectorId: 1,
              collector: {
                id: 1,
                firstName: "Juan",
                lastName: "Pérez",
                phone: "123456789"
              }
            },
            previousCollector: null,
            newCollector: {
              id: 1,
              firstName: "Juan",
              lastName: "Pérez"
            },
            action: "Nuevo"
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Cobrador ya asignado a esta ruta',
    schema: {
      example: {
        message: "El cobrador \"Juan Pérez\" ya está asignado a la ruta \"Ruta Centro Norte\"",
        code: 409,
        status: "success",
        data: {
          customMessage: "El cobrador \"Juan Pérez\" ya está asignado a la ruta \"Ruta Centro Norte\"",
          result: {
            success: true,
            action: "Ya asignado"
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: AssignCollectorToRouteDto,
    examples: {
      asignarCobrador: {
        summary: "Asignar cobrador a ruta",
        value: {
          collectorId: 1
        }
      }
    }
  })
  async assignCollectorToRoute(@Param('id') id: string, @Body() assignCollectorDto: AssignCollectorToRouteDto, @Req() req) {
    const result = await this.collectionRoutesService.assignCollectorToRoute(+id, assignCollectorDto);
    
    // Establecer el código de estado HTTP basado en el resultado
    if (result.statusCode === 409) {
      req.res.status(409);
    }

    return {
      customMessage: result.message,
      result: {
        success: result.success,
        route: result.route,
        previousCollector: result.previousCollector,
        newCollector: result.newCollector,
        action: result.action
      }
    };
  }

  @Post('bulk-assign-collectors')
  @HttpCode(200)
  @Permissions('assign.collector-to-route')
  @ApiOperation({ 
    summary: 'Asignación masiva y flexible de cobradores a rutas',
    description: `
    Permite asignar/desasignar cobradores a múltiples rutas de forma masiva.
    
    **Modalidades soportadas:**
    1. **Un cobrador a múltiples rutas:** Usar \`singleCollectorId\`
    2. **Cobradores específicos:** Usar \`collectorIds\` (debe coincidir con \`routeIds\`)
    3. **Desasignaciones:** Usar \`null\` como valor de cobrador
    4. **Operaciones mixtas:** Combinar asignaciones y desasignaciones
    
    **Casos de respuesta:**
    - **200:** Operaciones procesadas (total o parcial)
    - **409:** Todos ya estaban en el estado deseado
    - **400:** Datos inválidos o arrays no coinciden
    - **404:** Rutas o cobradores no encontrados
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asignaciones masivas procesadas exitosamente',
    schema: {
      example: {
        message: "Se procesaron algunas asignaciones (2 asignados, 1 reasignado), otros ya se encontraban en el estado correcto",
        code: 200,
        status: "success",
        data: {
          customMessage: "Se procesaron algunas asignaciones (2 asignados, 1 reasignado), otros ya se encontraban en el estado correcto",
          result: {
            success: true,
            summary: {
              totalProcessed: 5,
              assigned: 2,
              reassigned: 1,
              unassigned: 0,
              alreadyAssigned: 2,
              noChanges: 0
            },
            results: [{
              routeId: 1,
              routeName: "Ruta Centro Norte",
              previousCollectorId: null,
              newCollectorId: 1,
              action: "Nuevo",
              message: "Cobrador asignado a la ruta \"Ruta Centro Norte\""
            }]
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Todos ya estaban en el estado correcto',
    schema: {
      example: {
        message: "Todos los cobradores ya estaban asignados a sus rutas correspondientes",
        code: 409,
        status: "success",
        data: {
          customMessage: "Todos los cobradores ya estaban asignados a sus rutas correspondientes",
          result: {
            success: true,
            summary: {
              totalProcessed: 3,
              assigned: 0,
              reassigned: 0,
              unassigned: 0,
              alreadyAssigned: 3,
              noChanges: 0
            }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: BulkAssignCollectorsDto,
    examples: {
      unCobradorVariasRutas: {
        summary: "Un cobrador a múltiples rutas",
        value: {
          routeIds: [1, 2, 3],
          singleCollectorId: 1
        }
      },
      desasignarCobrador: {
        summary: "Desasignar cobrador de múltiples rutas",
        value: {
          routeIds: [1, 2, 3],
          singleCollectorId: null
        }
      },
      cobradoresEspecificos: {
        summary: "Cobradores específicos a rutas específicas",
        value: {
          routeIds: [1, 2, 3, 4],
          collectorIds: [1, 2, null, 1]
        }
      }
    }
  })
  async bulkAssignCollectors(@Body() bulkAssignDto: BulkAssignCollectorsDto, @Req() req) {
    const result = await this.collectionRoutesService.bulkAssignCollectors(bulkAssignDto);
    
    // Establecer el código de estado HTTP basado en el resultado
    if (result.statusCode === 409) {
      req.res.status(409);
    }

    return {
      customMessage: result.message,
      result: {
        success: result.success,
        summary: result.summary,
        results: result.results
      }
    };
  }

  @Post('bulk-assign-customers')
  @HttpCode(200)
  @Permissions('assign.customers-to-routes')
  @ApiOperation({ 
    summary: 'Asignación masiva y flexible de clientes a rutas',
    description: `
    Permite asignar/desasignar clientes a rutas de forma masiva y flexible.
    
    **Modalidades soportadas:**
    1. **Múltiples clientes a una ruta:** Usar \`singleRouteId\`
    2. **Clientes específicos a rutas específicas:** Usar \`routeIds\` (debe coincidir con \`customerIds\`)
    3. **Desasignaciones masivas:** Usar \`null\` como valor de ruta
    4. **Operaciones mixtas:** Combinar asignaciones, reasignaciones y desasignaciones
    
    **Casos de respuesta:**
    - **200:** Operaciones procesadas (total o parcial)
    - **409:** Todos ya estaban en el estado deseado
    - **400:** Datos inválidos o arrays no coinciden
    - **404:** Clientes o rutas no encontrados
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asignaciones masivas de clientes procesadas',
    schema: {
      example: {
        message: "Se procesaron algunas asignaciones (3 asignados, 1 reasignado), otros ya se encontraban en el estado correcto",
        code: 200,
        status: "success",
        data: {
          customMessage: "Se procesaron algunas asignaciones (3 asignados, 1 reasignado), otros ya se encontraban en el estado correcto",
          result: {
            success: true,
            summary: {
              totalProcessed: 6,
              assigned: 3,
              reassigned: 1,
              unassigned: 0,
              alreadyAssigned: 2,
              noChanges: 0
            },
            results: [{
              customerId: 1,
              customerName: "María García",
              previousRouteId: 2,
              newRouteId: 1,
              action: "Reasignado",
              message: "Cliente \"María García\" reasignado de ruta"
            }]
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Todos los clientes ya estaban en el estado correcto',
    schema: {
      example: {
        message: "Todos los clientes ya estaban asignados a sus rutas correspondientes",
        code: 409,
        status: "success",
        data: {
          customMessage: "Todos los clientes ya estaban asignados a sus rutas correspondientes",
          result: {
            success: true,
            summary: {
              totalProcessed: 4,
              assigned: 0,
              reassigned: 0,
              unassigned: 0,
              alreadyAssigned: 4,
              noChanges: 0
            }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: BulkAssignCustomersDto,
    examples: {
      mucosClientesUnaRuta: {
        summary: "Múltiples clientes a una ruta",
        value: {
          customerIds: [1, 2, 3, 4, 5],
          singleRouteId: 1
        }
      },
      desasignarClientes: {
        summary: "Desasignar múltiples clientes",
        value: {
          customerIds: [1, 2, 3],
          singleRouteId: null
        }
      },
      clientesEspecificos: {
        summary: "Clientes específicos a rutas específicas",
        value: {
          customerIds: [1, 2, 3, 4, 5],
          routeIds: [1, 2, null, 1, 3]
        }
      }
    }
  })
  async bulkAssignCustomers(@Body() bulkAssignDto: BulkAssignCustomersDto, @Req() req) {
    const result = await this.collectionRoutesService.bulkAssignCustomers(bulkAssignDto);
    
    // Establecer el código de estado HTTP basado en el resultado
    if (result.statusCode === 409) {
      req.res.status(409);
    }

    return {
      customMessage: result.message,
      result: {
        success: result.success,
        summary: result.summary,
        results: result.results
      }
    };
  }
}