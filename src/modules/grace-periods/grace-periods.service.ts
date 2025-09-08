import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GracePeriodsService {
  constructor (
    private readonly prisma: PrismaService
  ) {}
//   create(createGracePeriodDto: CreateGracePeriodDto) {
//     return 'This action adds a new gracePeriod';
//   }
// 
  async findAll() {
    const rawGracePeriods = await this.prisma.gracePeriod.findMany( { where: { isActive: true } });

    if(!rawGracePeriods || rawGracePeriods.length===0) throw new Error('No se encontraron periodos de gracia');

    return rawGracePeriods;

  }
// 
//   findOne(id: number) {
//     return `This action returns a #${id} gracePeriod`;
//   }
// 
//   update(id: number, updateGracePeriodDto: UpdateGracePeriodDto) {
//     return `This action updates a #${id} gracePeriod`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} gracePeriod`;
//   }
}
