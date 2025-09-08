import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class LoanTypesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  // create(createLoanTypeDto: CreateLoanTypeDto) {
  //   return 'This action adds a new loanType';
  // }

  async findAll() {
   const rawLoanTypes = await this.prisma.loanType.findMany({ where: {isActive: true } });
   if(!rawLoanTypes || rawLoanTypes.length === 0) throw new Error('No loan types found');
   return rawLoanTypes;
  }

//   findOne(id: number) {
//     return `This action returns a #${id} loanType`;
//   }
// 
//   update(id: number, updateLoanTypeDto: UpdateLoanTypeDto) {
//     return `This action updates a #${id} loanType`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} loanType`;
//   }
}
