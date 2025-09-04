import { Module } from '@nestjs/common';
import { InstallmentsService } from './installments.service';
import { InstallmentsController } from './installments.controller';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqModule } from '@infraestructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMqModule],
  controllers: [InstallmentsController],
  providers: [InstallmentsService, PrismaService],
  exports: [InstallmentsService],
})
export class InstallmentsModule {}
