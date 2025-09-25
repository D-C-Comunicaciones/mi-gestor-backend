import {
  Controller, Post, Body, Param, Patch, UseInterceptors, UploadedFile, ParseIntPipe,
  UseGuards, Get, Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, ResponseCompanyDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiExtraModels,
  ApiParam,
  ApiBody,
  ApiConsumes,
  getSchemaPath
} from '@nestjs/swagger';
import { CompanyListResponse, SwaggerCompanyListResponse, SwaggerCompanyResponse } from './interfaces/company-responses.interface';
import { CompanyResponse } from './interfaces';

/**
 * Controlador para la gestión de empresas
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con la información corporativa
 * del sistema. Permite a los administradores configurar datos empresariales, logos
 * e información de contacto que se utilizará en toda la aplicación.
 * 
 * Funcionalidades principales:
 * - Registro y actualización de información corporativa
 * - Gestión de logos e imagen de marca
 * - Configuración de datos de contacto y tributarios
 * - Consulta de información empresarial
 * 
 * La información empresarial es fundamental para:
 * - Personalización de la interfaz con datos corporativos
 * - Generación de documentos oficiales y contratos
 * - Configuración de marca en reportes y comunicaciones
 * - Cumplimiento de requisitos legales y tributarios
 * - Información de contacto para clientes
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Companies')
@ApiBearerAuth()
@ApiExtraModels(ResponseCompanyDto, SwaggerCompanyListResponse, SwaggerCompanyResponse)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService) { }

  @Get()
  @Permissions('view.companies')
  @ApiOperation({ 
    summary: 'Listar empresas', 
    description: 'Obtiene la lista completa de empresas registradas en el sistema con toda su información corporativa.' 
  })
  @ApiOkResponse({
    description: 'Lista de empresas obtenida correctamente',
    type: SwaggerCompanyListResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Listado de empresas' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            companies: {
              type: 'array',
              items: { $ref: getSchemaPath(ResponseCompanyDto) }
            }
          }
        }
      }
    },
    examples: {
      'listado-exitoso': {
        summary: 'Listado obtenido exitosamente',
        value: {
          customMessage: 'Listado de empresas',
          companies: [
            {
              id: 1,
              name: 'Mi Gestor Financiero S.A.S',
              identificationNumber: '900123456-7',
              address: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.',
              phone: '+57 1 234 5678',
              email: 'contacto@migestorfinanciero.com',
              logoUrl: 'logos/logo.png',
              createdAt: '2024-01-01 10:00:00',
              updatedAt: '2024-01-15 14:30:00'
            }
          ]
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron empresas',
    schema: {
      example: {
        message: 'No se encontraron empresas registradas',
        code: 404,
        status: 'error'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        code: { type: 'number', example: 401 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso view.companies',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver empresas' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async findAll(): Promise<CompanyListResponse> {
    this.logger.log('📋 Consultando listado de empresas');
    
    const rawCompanies = await this.companiesService.findAll();
    const companies = plainToInstance(ResponseCompanyDto, rawCompanies);
    
    return {
      customMessage: 'Listado de empresas',
      companies
    };
  }

  @Get(':id')
  @Permissions('view.companies')
  @ApiOperation({ 
    summary: 'Obtener empresa por ID', 
    description: 'Obtiene los detalles completos de una empresa específica incluyendo logo e información de contacto.' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único de la empresa',
    example: 1
  })
  @ApiOkResponse({
    description: 'Empresa encontrada correctamente',
    type: SwaggerCompanyResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Detalle de la empresa' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            company: { $ref: getSchemaPath(ResponseCompanyDto) }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'El ID debe ser un número válido' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        code: { type: 'number', example: 401 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso view.companies',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver empresas' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Empresa no encontrada',
    schema: {
      example: {
        message: 'Empresa con ID 999 no encontrada',
        code: 404,
        status: 'error'
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyResponse> {
    this.logger.log(`🔍 Consultando empresa con ID: ${id}`);
    
    const rawCompany = await this.companiesService.findOne(id);
    const company = plainToInstance(ResponseCompanyDto, rawCompany);
    
    return {
      customMessage: 'Detalle de la empresa',
      company
    };
  }

  @Post()
  @Permissions('create.companies')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Crear empresa', 
    description: 'Registra una nueva empresa en el sistema con información corporativa completa. Permite subir un logo como parte del registro.' 
  })
  @ApiBody({
    description: 'Datos de la empresa a crear (multipart/form-data para incluir logo)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Mi Gestor Financiero S.A.S' },
        nit: { type: 'string', example: '900123456' },
        verificationDigit: { type: 'string', example: '7' },
        phone: { type: 'string', example: '+57 1 234 5678' },
        email: { type: 'string', format: 'email', example: 'contacto@migestorfinanciero.com' },
        address: { type: 'string', example: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.' },
        logo: { 
          type: 'string', 
          format: 'binary', 
          description: 'Logo de la empresa (PNG, JPG, JPEG - máx 5MB)' 
        }
      },
      required: ['name', 'nit']
    }
  })
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './public/logos',
      filename: (req, file, callback) => {
        const ext = extname(file.originalname);
        callback(null, `logo${ext}`);
      },
    }),
  }))
  @ApiCreatedResponse({
    description: 'Empresa creada exitosamente',
    type: SwaggerCompanyResponse,
    examples: {
      'empresa-creada': {
        summary: 'Empresa creada exitosamente',
        value: {
          customMessage: 'Empresa creada exitosamente',
          company: {
            id: 1,
            name: 'Mi Gestor Financiero S.A.S',
            identificationNumber: '900123456-7',
            address: 'Calle 72 #10-50, Oficina 301, Bogotá D.C.',
            phone: '+57 1 234 5678',
            email: 'contacto@migestorfinanciero.com',
            logoUrl: 'logos/logo.png',
            createdAt: '2024-01-01 10:00:00',
            updatedAt: '2024-01-01 10:00:00'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o archivo no válido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        'nit-duplicado': {
          summary: 'NIT ya registrado',
          value: {
            message: 'El NIT ya está registrado en el sistema',
            code: 400,
            status: 'error'
          }
        },
        'archivo-invalido': {
          summary: 'Archivo de logo inválido',
          value: {
            message: 'El archivo debe ser una imagen PNG, JPG o JPEG menor a 5MB',
            code: 400,
            status: 'error'
          }
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Error de validación en los datos enviados',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['El nombre es obligatorio', 'El NIT debe contener solo números', 'El email debe tener un formato válido']
        },
        code: { type: 'number', example: 422 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        code: { type: 'number', example: 401 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso create.companies',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para crear empresas' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async create(
    @Body() data: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CompanyResponse> {
    this.logger.log(`🏢 Creando nueva empresa: ${data.name}`);
    
    const logoUrl = file ? `logos/logo${extname(file.originalname)}` : undefined;
    const rawCompany = await this.companiesService.create(data, file);
    const company = plainToInstance(ResponseCompanyDto, rawCompany);
    
    return {
      customMessage: 'Empresa creada exitosamente',
      company
    };
  }

  @Patch(':id')
  @Permissions('update.companies')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Actualizar empresa', 
    description: 'Actualiza los datos de una empresa existente. Solo se actualizan los campos proporcionados (actualización parcial). Permite cambiar el logo subiendo un nuevo archivo.' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único de la empresa a actualizar',
    example: 1
  })
  @ApiBody({
    description: 'Datos a actualizar de la empresa (multipart/form-data)',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Mi Gestor Financiero Actualizado S.A.S' },
        nit: { type: 'string', example: '900123456' },
        verificationDigit: { type: 'string', example: '7' },
        phone: { type: 'string', example: '+57 1 987 6543' },
        email: { type: 'string', format: 'email', example: 'nuevo@migestorfinanciero.com' },
        address: { type: 'string', example: 'Carrera 15 #93-40, Torre Empresarial, Piso 12' },
        logo: { 
          type: 'string', 
          format: 'binary', 
          description: 'Nuevo logo de la empresa (opcional)' 
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './public/logos',
      filename: (req, file, callback) => {
        const ext = extname(file.originalname);
        callback(null, `logo${ext}`);
      },
    }),
  }))
  @ApiOkResponse({
    description: 'Empresa actualizada exitosamente',
    type: SwaggerCompanyResponse,
    examples: {
      'empresa-actualizada': {
        summary: 'Empresa actualizada exitosamente',
        value: {
          customMessage: 'Empresa actualizada exitosamente',
          company: {
            id: 1,
            name: 'Mi Gestor Financiero Actualizado S.A.S',
            identificationNumber: '900123456-7',
            address: 'Carrera 15 #93-40, Torre Empresarial, Piso 12',
            phone: '+57 1 987 6543',
            email: 'nuevo@migestorfinanciero.com',
            logoUrl: 'logos/logo.jpg',
            createdAt: '2024-01-01 10:00:00',
            updatedAt: '2024-01-15 16:45:00'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o sin cambios',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        'sin-cambios': {
          summary: 'No se detectaron cambios',
          value: {
            message: 'No se detectaron cambios para actualizar',
            code: 400,
            status: 'error'
          }
        },
        'nit-duplicado': {
          summary: 'NIT ya existe',
          value: {
            message: 'El NIT ya está registrado por otra empresa',
            code: 400,
            status: 'error'
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Usuario no autenticado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        code: { type: 'number', example: 401 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Sin permiso update.companies',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para actualizar empresas' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Empresa no encontrada',
    schema: {
      example: {
        message: 'Empresa con ID 999 no encontrada',
        code: 404,
        status: 'error'
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CompanyResponse> {
    this.logger.log(`🔧 Actualizando empresa con ID: ${id}`);
    
    const rawCompany = await this.companiesService.update(id, data, file);
    const company = plainToInstance(ResponseCompanyDto, rawCompany);
    
    return {
      customMessage: 'Empresa actualizada exitosamente',
      company
    };
  }
}
