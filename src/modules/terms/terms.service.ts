import { Injectable } from '@nestjs/common';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class TermsService {
  constructor(private readonly prisma: PrismaService) { }

  // create(createTermDto: CreateTermDto) {
  //   return 'This action adds a new term';
  // }

  async findAll() {
    const rawTerms = await this.prisma.term.findMany();
    if(!rawTerms || rawTerms.length === 0) throw new Error('No terms found');
    return rawTerms;
  }

//   findOne(id: number) {
//     return `This action returns a #${id} term`;
//   }
// 
//   update(id: number, updateTermDto: UpdateTermDto) {
//     return `This action updates a #${id} term`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} term`;
//   }
}
