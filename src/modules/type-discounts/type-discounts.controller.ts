import { Controller, Get, UseGuards } from '@nestjs/common';
import { TypeDiscountsService } from './type-discounts.service';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { SwaggerTypeDiscounts } from '@common/decorators';

@Controller('type-discounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TypeDiscountsController {
  constructor(private readonly typeDiscountsService: TypeDiscountsService) {}

  @Get()
  @SwaggerTypeDiscounts()
  async findAll() {
    const typeDiscounts = await this.typeDiscountsService.findAll();
    return {
      customMessage: 'Lista de tipos de descuentos',
      typeDiscounts
    };
  }

}
