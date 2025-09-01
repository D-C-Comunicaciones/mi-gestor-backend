import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LoanOverdueWorker implements OnModuleInit {
  private readonly logger = new Logger(LoanOverdueWorker.name);
  private isConsuming = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Iniciando LoanOverdueWorker...');
    
    // Esperar conexión con RabbitMQ
    await this.rabbitMqService.waitForConnection();
    this.logger.log('✅ Conexión con RabbitMQ establecida');

    // Asegurar la cola
    await this.rabbitMqService.assertQueue(envs.rabbitMq.loanOverdueQueue);
    this.logger.log(`✅ Cola asegurada: ${envs.rabbitMq.loanOverdueQueue}`);

    // Iniciar consumo de mensajes
    await this.startConsuming();
  }

  private async handleMessage(msg: any) {
    if (!msg) return;
    
    const content = msg.content?.toString() ?? '';
    const { loanId } = JSON.parse(content);

    if (!loanId) {
      this.logger.warn('⚠️ Mensaje inválido: falta loanId');
      return;
    }

    const now = new Date();

    // Buscar la cuota más reciente vencida
    const installment = await this.prisma.installment.findFirst({
      where: {
        loanId,
        isPaid: false,
        statusId: 3,
        dueDate: { lt: now }
      },
      orderBy: { dueDate: 'asc' },
      include: { loan: { include: { interestRate: true } } }
    });

    if (!installment) {
      this.logger.log(`✅ No hay cuotas vencidas para loanId=${loanId}`);
      return;
    }

    const loan = installment.loan;
    const interestRateValue = loan.interestRate?.value ?? 0;
    const daysLate = Math.floor((now.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const moratoryInterestAmount = new Decimal(loan.loanAmount)
      .mul(interestRateValue)
      .mul(daysLate)
      .div(100);

    this.logger.log(`💰 Calculando moratoryInterest para loanId=${loan.id}, installmentId=${installment.id}`);
    this.logger.log(`    LoanAmount=${loan.loanAmount}, InterestRate=${interestRateValue}%, DaysLate=${daysLate}, Amount=${moratoryInterestAmount.toFixed(2)}`);

    // Actualizar o crear MoratoryInterest
    const existing = await this.prisma.moratoryInterest.findFirst({ where: { loanId: loan.id } });
    if (existing) {
      const newAmount = new Decimal(existing.amount).add(moratoryInterestAmount);
      const newDaysLate = Math.max(existing.daysLate, daysLate);
      await this.prisma.moratoryInterest.update({
        where: { id: existing.id },
        data: { amount: newAmount.toNumber(), daysLate: newDaysLate }
      });
      this.logger.log(`    📝 MoratoryInterest actualizado: newAmount=${newAmount.toFixed(2)}, daysLate=${newDaysLate}`);
    } else {
      await this.prisma.moratoryInterest.create({
        data: { loanId: loan.id, daysLate, amount: moratoryInterestAmount.toNumber() }
      });
      this.logger.log(`    📝 MoratoryInterest creado: amount=${moratoryInterestAmount.toFixed(2)}, daysLate=${daysLate}`);
    }

    // Re-publicar mensaje con delay
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanOverdueQueue,
      { loanId },
      60 * 1000 // 1 minuto de delay
    );

    this.logger.log(`📨 Mensaje re-publicado para loanId=${loan.id}, delay=60000ms`);
  }

  private async startConsuming() {
    if (this.isConsuming) return;

    this.logger.log('🔄 Iniciando consumo de mensajes LoanOverdueWorker...');
    await this.rabbitMqService.consume(envs.rabbitMq.loanOverdueQueue, (msg) => {
      this.handleMessage(msg).catch(err => this.logger.error('❌ Error procesando mensaje:', err));
    });

    this.isConsuming = true;
    this.logger.log('✅ Consumo iniciado LoanOverdueWorker');
  }
}
