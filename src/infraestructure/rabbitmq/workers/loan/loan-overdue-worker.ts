import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LoanOverdueWorker implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly rabbitMqService: RabbitMqService) {}

  async onModuleInit() {
    await this.rabbitMqService.assertQueue(envs.rabbitMq.loanOverdueQueue);
    await this.rabbitMqService.consume(envs.rabbitMq.loanOverdueQueue, (msg) => this.handleMessage(msg));
  }

  private async handleMessage(msg: any) {
    const now = new Date();

    // Obtener todas las cuotas vencidas y no pagadas
    const overdueInstallments = await this.prisma.installment.findMany({
      where: { isPaid: false, dueDate: { lt: now } },
      include: { loan: { include: { penaltyRate: true } } },
    });

    for (const installment of overdueInstallments) {
      const penaltyRate = installment.loan.penaltyRate?.value ?? new Decimal(0);
      const overdueDays = Math.floor((now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const moratoryInterest = Decimal(installment.totalAmount)
        .mul(penaltyRate.toNumber())
        .mul(overdueDays)
        .div(100);

      await this.prisma.installment.update({
        where: { id: installment.id },
        data: { totalAmount: Decimal(installment.totalAmount).add(moratoryInterest) },
      });

      // Re-publicar mensaje para re-evaluar la cuota en 24h
      await this.rabbitMqService.sendToQueue(
        envs.rabbitMq.loanOverdueQueue,
        { loanId: installment.loanId, installmentId: installment.id },
        { headers: { 'x-delay': 24 * 60 * 60 * 1000 } } // 24h
      );
    }
  }
}
