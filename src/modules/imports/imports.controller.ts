import { Controller, Get, Param, ParseIntPipe, Query, Res } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { PaginationDto } from '@common/dto';
import { ImportListResponse, ImportResponse } from './interfaces';
import { ResponseImportDto } from './dto/response-import.dto';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

@Controller('imports')
export class ImportsController {
  constructor(
    private readonly importsService: ImportsService,
  ) { }

  /** 📄 Obtiene todas las importaciones ordenadas por fecha descendente */
  @Get('customers')
  async findAllCustomersImports(
    @Query() rolePaginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ImportListResponse> {
    const { Imports, meta } = await this.importsService.findAllCustomersImports(rolePaginationDto);

    if (Imports.length === 0) {
      res.status(404);
      return {
        customMessage: 'No existen registros',
        customersImports: [],
        meta,
      };
    }

    const customersImports = plainToInstance(ResponseImportDto, Imports, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: "Historial de importación de clientes",
      customersImports,
      meta,
    };
  }

  /** 📄 Obtiene una importación específica por ID */
  @Get('customers/:id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ImportResponse> {
    const customerImport = await this.importsService.findOne(id);
    return {
      customMessage: "Historial de importación de clientes obtenida",
      customerImport: plainToInstance(ResponseImportDto, customerImport, {
        excludeExtraneousValues: true
      }),
    };
  }
}
