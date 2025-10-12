import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiQuery,
} from '@nestjs/swagger';

export function SwaggerFindAllCollectorsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar cobradores',
      description: `Obtiene una lista paginada de cobradores con múltiples opciones de filtrado.
      
**Parámetros disponibles:**
- \`page\`: Número de página (por defecto: 1)
- \`limit\`: Cantidad de registros por página (por defecto: 10)
- \`isActive\`: Filtrar por estado activo/inactivo
- \`assigned\`: Filtrar por asignación a rutas (true = con rutas, false = sin rutas)

**Ejemplos de uso:**
- \`/v1/collectors\` - Todos los cobradores (paginación por defecto)
- \`/v1/collectors?assigned=false\` - Solo cobradores sin rutas asignadas
- \`/v1/collectors?assigned=true\` - Solo cobradores con rutas asignadas
- \`/v1/collectors?isActive=true\` - Solo cobradores activos
- \`/v1/collectors?isActive=false\` - Solo cobradores inactivos
- \`/v1/collectors?page=2&limit=20\` - Segunda página con 20 registros
- \`/v1/collectors?assigned=false&isActive=true\` - Cobradores activos sin rutas
- \`/v1/collectors?assigned=true&isActive=true&page=1&limit=5\` - Primera página de cobradores activos con rutas (5 por página)`,
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
      description: 'Filtrar por asignación a rutas: true (con rutas) o false (sin rutas)',
      example: false
    }),
    ApiOkResponse({
      description: 'Listado de cobradores obtenido correctamente.',
      schema: {
        examples: {
          'todos-los-cobradores': {
            summary: 'Todos los cobradores (sin filtros)',
            value: {
              customMessage: 'Cobradores obtenidos correctamente',
              collectors: [
                {
                  id: 1,
                  firstName: 'fernando',
                  lastName: 'torres',
                  typeDocumentIdentificationId: 1,
                  documentNumber: 1234567892,
                  birthDate: '2005-05-14',
                  genderId: 1,
                  phone: '+573001234567',
                  address: 'en su casa',
                  userId: 5,
                  user: {
                    id: 5,
                    email: 'collector1@dcmigestor.co',
                    name: 'fernando torres',
                  },
                  createdAt: '2025-09-23 14:30:35',
                  updatedAt: '2025-09-23 14:30:35',
                },
              ],
              meta: {
                total: 10,
                page: 1,
                lastPage: 1,
                limit: 10,
                hasNextPage: false,
              },
            },
          },
          'cobradores-sin-rutas': {
            summary: 'Solo cobradores sin rutas asignadas (assigned=false)',
            value: {
              customMessage: 'Cobradores obtenidos correctamente',
              collectors: [
                {
                  id: 3,
                  firstName: 'Carlos',
                  lastName: 'Méndez',
                  documentNumber: 9876543210,
                  phone: '+573009876543',
                  user: {
                    email: 'carlos.mendez@migestor.com',
                  },
                },
              ],
              meta: {
                total: 1,
                page: 1,
                lastPage: 1,
                limit: 10,
                hasNextPage: false,
              },
            },
          },
          'cobradores-activos-con-rutas': {
            summary: 'Cobradores activos con rutas (assigned=true&isActive=true)',
            value: {
              customMessage: 'Cobradores obtenidos correctamente',
              collectors: [
                {
                  id: 1,
                  firstName: 'fernando',
                  lastName: 'torres',
                  documentNumber: 1234567892,
                  phone: '+573001234567',
                  user: {
                    email: 'collector1@dcmigestor.co',
                  },
                },
                {
                  id: 2,
                  firstName: 'Ana',
                  lastName: 'López',
                  documentNumber: 5555555555,
                  phone: '+573005555555',
                  user: {
                    email: 'ana.lopez@migestor.com',
                  },
                },
              ],
              meta: {
                total: 2,
                page: 1,
                lastPage: 1,
                limit: 10,
                hasNextPage: false,
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Usuario no autenticado.',
      schema: {
        example: {
          message: 'Acceso no autorizado. Por favor, inicie sesión para continuar.',
          code: 401,
          status: 'error',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permiso view.collectors.',
      schema: {
        example: {
          message: 'No tiene los permisos necesarios para realizar esta acción.',
          code: 403,
          status: 'error',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor.',
      schema: {
        example: {
          message: 'Error interno del servidor',
          code: 500,
          status: 'error',
        },
      },
    }),
  );
}