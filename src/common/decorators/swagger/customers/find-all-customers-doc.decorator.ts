import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiOkResponse, 
  ApiNotFoundResponse, 
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse, 
  ApiInternalServerErrorResponse, 
  ApiQuery 
} from '@nestjs/swagger';

export function SwaggerFindAllCustomersDoc() {
    return applyDecorators(
      ApiOperation({ 
        summary: 'Listar clientes', 
        description: `Obtiene una lista paginada de clientes con múltiples opciones de filtrado.
        
**Parámetros disponibles:**
- \`page\`: Número de página (por defecto: 1)
- \`limit\`: Cantidad de registros por página (por defecto: 10)
- \`isActive\`: Filtrar por estado activo/inactivo
- \`assigned\`: Filtrar por asignación a rutas (true = asignados, false = sin asignar)

**Ejemplos de uso:**
- \`/v1/customers\` - Todos los clientes (paginación por defecto)
- \`/v1/customers?assigned=false\` - Solo clientes sin ruta asignada
- \`/v1/customers?assigned=true\` - Solo clientes con ruta asignada
- \`/v1/customers?isActive=true\` - Solo clientes activos
- \`/v1/customers?isActive=false\` - Solo clientes inactivos
- \`/v1/customers?page=2&limit=20\` - Segunda página con 20 registros
- \`/v1/customers?assigned=false&isActive=true\` - Clientes activos sin ruta
- \`/v1/customers?assigned=true&isActive=true&page=1&limit=5\` - Primera página de clientes activos con ruta (5 por página)`
      }),
      ApiQuery({ 
        name: 'page', 
        required: false, 
        type: Number,
        description: 'Número de página a consultar',
        example: 1 
      }),
      ApiQuery({ 
        name: 'limit', 
        required: false, 
        type: Number,
        description: 'Cantidad de registros por página',
        example: 10 
      }),
      ApiQuery({ 
        name: 'isActive', 
        required: false, 
        type: Boolean,
        description: 'Filtrar por estado: true (activos) o false (inactivos)',
        example: true 
      }),
      ApiQuery({ 
        name: 'assigned', 
        required: false, 
        type: Boolean,
        description: 'Filtrar por asignación a rutas: true (asignados) o false (sin asignar)',
        example: false 
      }),
      ApiOkResponse({
        description: 'Listado obtenido',
        schema: {
          examples: {
            'todos-los-clientes': {
              summary: 'Todos los clientes (sin filtros)',
              value: {
                customMessage: 'Clientes obtenidos correctamente',
                customers: [
                  {
                    id: 1,
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    documentNumber: '12345678',
                    email: 'juan.perez@ejemplo.com',
                    phone: '+57 300 123 4567',
                    isActive: true,
                    createdAt: '2024-01-15T10:30:00.000Z',
                    updatedAt: '2024-01-20T14:45:00.000Z'
                  },
                  {
                    id: 2,
                    firstName: 'María',
                    lastName: 'García',
                    documentNumber: '87654321',
                    email: 'maria.garcia@ejemplo.com',
                    phone: '+57 300 987 6543',
                    isActive: true,
                    createdAt: '2024-01-16T11:30:00.000Z',
                    updatedAt: '2024-01-21T15:45:00.000Z'
                  }
                ],
                meta: {
                  total: 25,
                  page: 1,
                  lastPage: 3,
                  limit: 10,
                  hasNextPage: true
                }
              }
            },
            'clientes-sin-ruta': {
              summary: 'Solo clientes sin ruta asignada (assigned=false)',
              value: {
                customMessage: 'Clientes obtenidos correctamente',
                customers: [
                  {
                    id: 5,
                    firstName: 'Pedro',
                    lastName: 'Ramírez',
                    documentNumber: '11223344',
                    email: 'pedro.ramirez@ejemplo.com',
                    phone: '+57 300 112 2334',
                    isActive: true,
                    createdAt: '2024-01-18T09:15:00.000Z',
                    updatedAt: '2024-01-18T09:15:00.000Z'
                  }
                ],
                meta: {
                  total: 1,
                  page: 1,
                  lastPage: 1,
                  limit: 10,
                  hasNextPage: false
                }
              }
            },
            'clientes-activos-con-ruta': {
              summary: 'Clientes activos con ruta asignada (assigned=true&isActive=true)',
              value: {
                customMessage: 'Clientes obtenidos correctamente',
                customers: [
                  {
                    id: 1,
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    documentNumber: '12345678',
                    email: 'juan.perez@ejemplo.com',
                    phone: '+57 300 123 4567',
                    isActive: true,
                    createdAt: '2024-01-15T10:30:00.000Z',
                    updatedAt: '2024-01-20T14:45:00.000Z'
                  },
                  {
                    id: 2,
                    firstName: 'María',
                    lastName: 'García',
                    documentNumber: '87654321',
                    email: 'maria.garcia@ejemplo.com',
                    phone: '+57 300 987 6543',
                    isActive: true,
                    createdAt: '2024-01-16T11:30:00.000Z',
                    updatedAt: '2024-01-21T15:45:00.000Z'
                  }
                ],
                meta: {
                  total: 2,
                  page: 1,
                  lastPage: 1,
                  limit: 10,
                  hasNextPage: false
                }
              }
            }
          }
        }
      }),
      ApiNotFoundResponse({ 
        description: 'No existen registros',
        schema: {
          example: {
            customMessage: 'No existen registros',
            customers: [],
            meta: {
              total: 0,
              page: 1,
              lastPage: 0,
              limit: 10,
              hasNextPage: false
            }
          }
        }
      }),
      ApiUnauthorizedResponse({ 
        description: 'No autenticado',
        schema: {
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
        }
      }),
      ApiForbiddenResponse({ 
        description: 'Sin permiso view.customers',
        schema: {
          example: {
            statusCode: 403,
            message: 'No tienes permisos para ver los clientes',
            error: 'Forbidden'
          }
        }
      }),
      ApiInternalServerErrorResponse({ 
        description: 'Error interno',
        schema: {
          example: {
            statusCode: 500,
            message: 'Error interno del servidor al obtener los clientes',
            error: 'Internal Server Error'
          }
        }
      })
    );
}