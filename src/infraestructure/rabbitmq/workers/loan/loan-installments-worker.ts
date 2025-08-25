import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { InstallmentsService } from '@modules/installments/installments.service';

@Injectable()
export class LoanInstallmentWorker implements OnModuleInit {
  private readonly processingInterval = 10 * 1000; // fallback genérico
  private readonly monitorIntervalMs = 60 * 1000;   // ⏱️ monitoreo cada 1 minuto
  private readonly logger = new Logger(LoanInstallmentWorker.name);
  private isConsuming = false;
  private readonly maxProcessingAttempts = 3;
  private monitorTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly installmentsService: InstallmentsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Iniciando LoanInstallmentWorker...');
    try {
      this.logger.log('⏳ Esperando conexión con RabbitMQ...');
      await this.rabbitMqService.waitForConnection();
      this.logger.log('✅ Conexión con RabbitMQ establecida');

      this.logger.log(`🔧 Asegurando/creando cola "${envs.rabbitMq.loanInstallmentsQueue}"...`);
      const info = await this.rabbitMqService.assertQueue(envs.rabbitMq.loanInstallmentsQueue);
      this.logger.log(`✅ Cola lista: msg=${(info as any)?.messageCount ?? 'n/a'} | consumers=${(info as any)?.consumerCount ?? 'n/a'}`);

      await this.startConsuming();
      this.startMonitorLoop();
    } catch (error) {
      this.logger.error('❌ Error iniciando worker:', error);
      setTimeout(() => this.onModuleInit(), 10000);
    }
  }

  /** Monitorea la cola cada minuto y reporta estado; intenta reactivar consumo si se detuvo */
  private startMonitorLoop() {
    if (this.monitorTimer) clearInterval(this.monitorTimer);

    this.monitorTimer = setInterval(async () => {
      try {
        const info = await this.rabbitMqService.assertQueue(envs.rabbitMq.loanInstallmentsQueue);
        const messageCount = (info as any)?.messageCount ?? 0;
        const consumerCount = (info as any)?.consumerCount ?? 0;

        this.logger.log(`📊 Monitor: mensajes=${messageCount}, consumers=${consumerCount}`);

        if (!this.isConsuming) {
          this.logger.warn('⚠️ Monitor: no hay consumidor activo. Intentando reiniciar consumo...');
          await this.startConsuming();
        }
      } catch (err) {
        this.logger.error('❌ Monitor: error consultando estado de la cola:', err);
      }
    }, this.monitorIntervalMs);

    this.logger.log(`⏱️ Monitor de cola iniciado (intervalo=${this.monitorIntervalMs / 1000}s)`);
  }

  private async handleMessage(msg: any): Promise<void> {
    if (!msg) {
      this.logger.warn('⚠️ handleMessage: mensaje nulo/indefinido recibido por el consumidor');
      return;
    }

    const messageContent = msg.content?.toString?.() ?? '';
    this.logger.log(`📩 Mensaje recibido crudo: ${messageContent}`);

    try {
      const parsedMessage = JSON.parse(messageContent);
      const loanId: number = parsedMessage.loanId;
      const remainingInstallments: number | null = parsedMessage.remainingInstallments ?? null;

      if (!loanId) {
        this.logger.warn('⚠️ Mensaje inválido: falta loanId. Se descarta.');
        return;
      }

      this.logger.log(
        `✅ Mensaje válido: loanId=${loanId}, remainingInstallments=${remainingInstallments ?? '∞'}`
      );

      await this.processLoanWithRetry(loanId, remainingInstallments);
    } catch (parseError) {
      this.logger.error('❌ Error parseando mensaje JSON:', parseError);
    }
  }

  private async processLoanWithRetry(
    loanId: number,
    remainingInstallments: number | null,
    attempt: number = 1
  ): Promise<void> {
    this.logger.log(`▶️ Procesando loanId=${loanId}, intento=${attempt}`);
    try {
      await this.processLoanInstallment(loanId, remainingInstallments);
      this.logger.log(
        `✅ Procesamiento OK para loan ${loanId} (cuotas restantes=${remainingInstallments !== null ? remainingInstallments - 1 : '∞'})`
      );
    } catch (error) {
      this.logger.error(`❌ Error procesando loan ${loanId} (intento ${attempt}):`, error);

      if (attempt < this.maxProcessingAttempts) {
        const retryDelay = attempt * 2000;
        this.logger.warn(`🔄 Reintentando loan ${loanId} en ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await this.processLoanWithRetry(loanId, remainingInstallments, attempt + 1);
      } else {
        this.logger.error(`🚨 Máximo de intentos alcanzado para loan ${loanId}. Abortando.`);
      }
    }
  }

  private async processLoanInstallment(
    loanId: number,
    remainingInstallments: number | null
  ): Promise<void> {
    if (remainingInstallments !== null && remainingInstallments <= 0) {
      this.logger.log(`🏁 Loan ${loanId} ya no tiene cuotas restantes. No se procesa.`);
      return;
    }

    this.logger.debug(`🔎 Buscando loan con ID=${loanId} (activo=true)...`);
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId, isActive: true },
      include: {
        installments: { orderBy: { sequence: 'desc' }, take: 1 },
        paymentFrequency: true,
        loanType: true,
        term: true,
        gracePeriod: true,
      },
    });

    if (!loan) {
      this.logger.warn(`⚠️ Loan ${loanId} no existe o está inactivo.`);
      return;
    }

    this.logger.log(
      `📘 Loan cargado: type=${loan.loanType?.name} | freq=${loan.paymentFrequency?.name} | lastSeq=${loan.installments?.[0]?.sequence ?? 0}`
    );

    // Crear la próxima cuota
    const installment = await this.installmentsService.createNextInstallment(loanId);
    this.logger.log(`💰 Cuota creada: id=${installment.id}, secuencia=${installment.sequence}, dueDate=${installment.dueDate}`);

    // Lógica de re-publicación
    const nextDelay = this.calculateNextDelay(loan.paymentFrequency.name);
    this.logger.log(`⏲️ Próximo delay: ${this.formatMs(nextDelay)} (freq=${loan.paymentFrequency.name})`);

    if (loan.loanType.name === 'fixed_fees') {
      const termValue = loan.term?.value ?? 0;
      const newRemaining = (remainingInstallments ?? termValue) - 1;

      if (newRemaining > 0) {
        await this.rabbitMqService.publishWithDelay(
          envs.rabbitMq.loanInstallmentsQueue,
          { loanId, remainingInstallments: newRemaining },
          nextDelay
        );
        this.logger.log(`📨 Re-publicado loan ${loanId}, cuotas restantes=${newRemaining}`);
      } else {
        this.logger.log(`🏁 Loan ${loanId} completó todas sus cuotas (fixed_fees).`);
      }
    } else if (loan.loanType.name === 'only_interests') {
      await this.rabbitMqService.publishWithDelay(
        envs.rabbitMq.loanInstallmentsQueue,
        { loanId },
        nextDelay
      );
      this.logger.log(`📨 Re-publicado loan ${loanId} (only_interests indefinido)`);
    }
  }

  /** Calcula el delay según frecuencia */
  private calculateNextDelay(paymentFrequency: string): number {
    const freq = paymentFrequency.toUpperCase();

    const delays: Record<string, number> = {
      'MINUTO': 60 * 1000,
      'MINUTE': 60 * 1000,
      'HORA': 60 * 60 * 1000,
      'HOURLY': 60 * 60 * 1000,
      'DIARIA': 24 * 60 * 60 * 1000,
      'DAILY': 24 * 60 * 60 * 1000,
      'SEMANAL': 7 * 24 * 60 * 60 * 1000,
      'WEEKLY': 7 * 24 * 60 * 60 * 1000,
      'QUINCENAL': 15 * 24 * 60 * 60 * 1000,
      'BIWEEKLY': 15 * 24 * 60 * 60 * 1000,
      'MENSUAL': 30 * 24 * 60 * 60 * 1000,
      'MONTHLY': 30 * 24 * 60 * 60 * 1000,
      'ANUAL': 365 * 24 * 60 * 60 * 1000,
      'YEARLY': 365 * 24 * 60 * 60 * 1000,
    };

    for (const key in delays) {
      if (freq.includes(key)) return delays[key];
    }

    this.logger.warn(`⚠️ Frecuencia desconocida "${paymentFrequency}", usando fallback ${this.formatMs(this.processingInterval)}`);
    return this.processingInterval;
  }

  private formatMs(ms: number): string {
    if (ms % (365 * 24 * 60 * 60 * 1000) === 0) return `${ms / (365 * 24 * 60 * 60 * 1000)}y`;
    if (ms % (30 * 24 * 60 * 60 * 1000) === 0) return `${ms / (30 * 24 * 60 * 60 * 1000)}M`;
    if (ms % (24 * 60 * 60 * 1000) === 0) return `${ms / (24 * 60 * 60 * 1000)}d`;
    if (ms % (60 * 60 * 1000) === 0) return `${ms / (60 * 60 * 1000)}h`;
    if (ms % (60 * 1000) === 0) return `${ms / (60 * 1000)}m`;
    if (ms % 1000 === 0) return `${ms / 1000}s`;
    return `${ms}ms`;
  }

  async startConsuming(): Promise<void> {
    if (this.isConsuming) {
      this.logger.warn('⚠️ startConsuming: ya iniciado, omitiendo...');
      return;
    }

    try {
      this.logger.log('🔄 Iniciando consumo de mensajes...');
      await this.rabbitMqService.consume(
        envs.rabbitMq.loanInstallmentsQueue,
        (msg) => {
          this.logger.log('📥 Mensaje entregado por RabbitMQ');
          this.handleMessage(msg).catch(error => {
            this.logger.error('❌ Error en handleMessage:', error);
          });
        }
      );

      this.isConsuming = true;
      this.logger.log('✅ Consumo de mensajes iniciado');
    } catch (error) {
      this.logger.error('❌ Error iniciando consumo:', error);
      this.isConsuming = false;

      setTimeout(() => {
        this.logger.warn('🔄 Reintentando iniciar consumo en 5s...');
        this.startConsuming();
      }, 5000);
    }
  }

  async stopConsuming(): Promise<void> {
    this.logger.log('🛑 Deteniendo consumo de mensajes');
    this.isConsuming = false;
  }

  getStatus(): { isConsuming: boolean; queue: string } {
    return { isConsuming: this.isConsuming, queue: envs.rabbitMq.loanInstallmentsQueue };
  }
}
