import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class PenaltyRatesService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

//   create(createPenaltyRateDto: CreatePenaltyRateDto) {
//     return 'This action adds a new penaltyRate';
//   }
// 
  async findAll() {
    const rawPenaltyRates = await this.prisma.penaltyRate.findMany( { where: { isActive: true } } );

    if(!rawPenaltyRates || rawPenaltyRates.length ===0) throw new Error('No penalty rates found');

        // 🔑 Mapeo para convertir Decimal a number
    return rawPenaltyRates.map(rate => ({
      ...rate,
      value: rate.value ? Number(rate.value) : 0
    }));

  }
// 
//   findOne(id: number) {
//     return `This action returns a #${id} penaltyRate`;
//   }
// 
//   update(id: number, updatePenaltyRateDto: UpdatePenaltyRateDto) {
//     return `This action updates a #${id} penaltyRate`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} penaltyRate`;
//   }
}
