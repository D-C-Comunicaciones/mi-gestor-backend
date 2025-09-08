import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentFrequenciesService } from './payment-frequencies.service';
import { PaymenFrequencyListResponse } from './interfaces';
import { ResponsePaymentFrequencyDto } from './dto';
import { plainToInstance } from 'class-transformer';

@Controller('payment-frequencies')
export class PaymentFrequenciesController {
  constructor(private readonly paymentFrequenciesService: PaymentFrequenciesService) {}

//   @Post()
//   create(@Body() createPaymentFrequencyDto: CreatePaymentFrequencyDto) {
//     return this.paymentFrequenciesService.create(createPaymentFrequencyDto);
//   }
// 
  @Get()
  async findAll(): Promise<PaymenFrequencyListResponse> {
    const rawPaymentFrequencies = await this.paymentFrequenciesService.findAll();
    const paymentFrequencies = plainToInstance(ResponsePaymentFrequencyDto, rawPaymentFrequencies, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de frecuencias de pago',
      paymentFrequencies
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.paymentFrequenciesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePaymentFrequencyDto: UpdatePaymentFrequencyDto) {
//     return this.paymentFrequenciesService.update(+id, updatePaymentFrequencyDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.paymentFrequenciesService.remove(+id);
//   }
}
