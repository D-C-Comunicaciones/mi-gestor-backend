import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class PaymentFrequenciesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
//   create(createPaymentFrequencyDto: CreatePaymentFrequencyDto) {
//     return 'This action adds a new paymentFrequency';
//   }
// 
  async findAll() {
    const rawPaymentFrequencies = await this.prisma.paymentFrequency.findMany({ where: { isActive: true } });

    if(!rawPaymentFrequencies || rawPaymentFrequencies.length === 0) throw new Error('No se encontraron frecuencias de pago');

    return rawPaymentFrequencies;
  }
// 
//   findOne(id: number) {
//     return `This action returns a #${id} paymentFrequency`;
//   }
// 
//   update(id: number, updatePaymentFrequencyDto: UpdatePaymentFrequencyDto) {
//     return `This action updates a #${id} paymentFrequency`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} paymentFrequency`;
//   }
}
