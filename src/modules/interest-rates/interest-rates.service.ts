import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class InterestRatesService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  // create(createInterestRateDto: CreateInterestRateDto) {
  //   return 'This action adds a new interestRate';
  // }

  async findAll() {
    const rawInterestRate = await this.prisma.interestRate.findMany();

    if (!rawInterestRate || rawInterestRate.length === 0) {
      throw new Error('No interest rates found');
    }

    // 🔑 Mapeo para convertir Decimal a number
    return rawInterestRate.map(rate => ({
      ...rate,
      value: rate.value ? Number(rate.value) : 0
    }));
  }

  //   findOne(id: number) {
  //     return `This action returns a #${id} interestRate`;
  //   }
  // 
  //   update(id: number, updateInterestRateDto: UpdateInterestRateDto) {
  //     return `This action updates a #${id} interestRate`;
  //   }
  // 
  //   remove(id: number) {
  //     return `This action removes a #${id} interestRate`;
  //   }
}
