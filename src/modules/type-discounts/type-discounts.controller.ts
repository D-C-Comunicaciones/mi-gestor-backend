import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TypeDiscountsService } from './type-discounts.service';

@Controller('type-discounts')
export class TypeDiscountsController {
  constructor(private readonly typeDiscountsService: TypeDiscountsService) {}

  @Get()
  async findAll() {
    const typeDiscounts = await this.typeDiscountsService.findAll();
    return {
      customMessage: 'Lista de tipos de descuentos',
      typeDiscounts
    };
  }


}
