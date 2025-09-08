import { Injectable } from '@nestjs/common';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class GendersService {
  constructor(
    private readonly prisma: PrismaService
  ) { }  

  // create(createGenderDto: CreateGenderDto) {
  //   return 'This action adds a new gender';
  // }

  async findAll() {
    const rawGenders = await this.prisma.gender.findMany({ where: { isActive: true } });

    if (!rawGenders || rawGenders.length === 0) {
      throw new Error('No active genders found');
    }

    return rawGenders;
  }

//   findOne(id: number) {
//     return `This action returns a #${id} gender`;
//   }
// 
//   update(id: number, updateGenderDto: UpdateGenderDto) {
//     return `This action updates a #${id} gender`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} gender`;
//   }
}
