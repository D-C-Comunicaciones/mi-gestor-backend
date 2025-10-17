import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Response, Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { DiscountListResponse } from './interfaces';
import { DiscountPaginationDto, ResponseDiscountDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { SwaggerCreateDiscountDoc, SwaggerFindAllDiscountsDoc } from '@common/decorators/swagger';

@ApiTags('discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  // ---------------- CREATE DISCOUNT ----------------
  @Post()
  @Permissions('create.discounts')
  @SwaggerCreateDiscountDoc()
  async create(@Body() createDiscountDto: CreateDiscountDto, @Req() req: Request) {
    const discount = await this.discountsService.create(createDiscountDto, req);

    // discount ya convertido y formateado por el servicio
    const responseDiscount = plainToInstance(ResponseDiscountDto, discount, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: "Descuento creado exitosamente",
      responseDiscount
    }
  }

  // ---------------- FIND ALL DISCOUNTS ----------------
  @Get()
  @Permissions('view.discounts')
  @SwaggerFindAllDiscountsDoc()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() paginationDto: DiscountPaginationDto,
  ): Promise<DiscountListResponse> {
    const { discounts, meta } = await this.discountsService.findAll(paginationDto);

    if (discounts.length === 0) {
      return {
        customMessage: 'No existen registros',
        discounts: [],
        meta,
      };
    }

    const discountsResponse = plainToInstance(ResponseDiscountDto, discounts, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      customMessage: 'Listado general de descuentos',
      discounts: discountsResponse,
      meta,
    };
  }
}