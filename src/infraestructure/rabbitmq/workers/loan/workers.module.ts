import { Module } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { LoanInstallmentWorker } from './loan-installments-worker';
import { LoanOverdueWorker } from './loan-overdue-worker';
import { InstallmentsService } from '@modules/installments/installments.service';

@Module({
    providers: [
        PrismaService,
        RabbitMqService,
        LoanInstallmentWorker,
        LoanOverdueWorker,
        InstallmentsService,
    ],
})
export class WorkersModule { }
