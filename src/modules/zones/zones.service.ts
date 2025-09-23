import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(
    private readonly prisma: PrismaService
  ) { }
  // create(createZoneDto: CreateZoneDto) {
  //   return 'This action adds a new zone';
  // }

  async findAll() {
    const rawZones = await this.prisma.zone.findMany({ where: { isActive: true } });

    if( !rawZones || rawZones.length === 0 ) {
      
      throw new Error('No zones found');
    }

    return rawZones;
  }

//   findOne(id: number) {
//     return `This action returns a #${id} zone`;
//   }
// 
//   update(id: number, updateZoneDto: UpdateZoneDto) {
//     return `This action updates a #${id} zone`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} zone`;
//   }
}
