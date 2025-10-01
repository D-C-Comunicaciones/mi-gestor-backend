import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class TypeDiscountsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    const typeDiscounts = await this.prisma.discountType.findMany();
    return typeDiscounts;
  }

}
