import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { InstallmentsService } from '@modules/installments/installments.service';

@Injectable()
export class LoanInstallmentWorker implements OnModuleInit {
  private readonly processingInterval = 10 * 1000; // intervalo en milisegundos (ejemplo 10 segundos)
  private readonly logger = new Logger(LoanInstallmentWorker.name);
  private isConsuming: boolean = false;
  private readonly maxProcessingAttempts = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly installmentsService: InstallmentsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando LoanInstallmentWorker...');
    
    try {
      // 🔥 ESPERAR EXPLÍCITAMENTE LA CONEXIÓN ANTES DE CONFIGURAR LA COLA
      this.logger.log('Esperando conexión con RabbitMQ...');
      await this.rabbitMqService.waitForConnection();
      
      // Configurar la cola
      this.logger.log(`Configurando cola: ${envs.rabbitMq.loanInstallmentsQueue}`);
      await this.rabbitMqService.assertQueue(envs.rabbitMq.loanInstallmentsQueue);

      this.logger.log(`✅ Cola ${envs.rabbitMq.loanInstallmentsQueue} configurada correctamente`);
      this.logger.log('Esperando mensajes...');

      // Iniciar consumo después de asegurar la conexión
      await this.startConsuming();
      
    } catch (error) {
      this.logger.error('❌ Error crítico inicializando worker:', error);
      // Reintentar después de un tiempo en caso de error crítico
      setTimeout(() => this.onModuleInit(), 10000);
    }
  }

  private async handleMessage(msg: any): Promise<void> {
    const messageContent = msg.content.toString();
    this.logger.log(`📩 Mensaje recibido: ${messageContent}`);

    let loanId: number;
    try {
      const parsedMessage = JSON.parse(messageContent);
      loanId = parsedMessage.loanId;
      
      if (!loanId) {
        this.logger.warn('⚠️ Mensaje sin loanId, descartando...');
        return;
      }
    } catch (parseError) {
      this.logger.error('❌ Error parseando mensaje JSON:', parseError);
      return;
    }

    // Procesar el mensaje con reintentos
    await this.processLoanWithRetry(loanId);
  }

  private async processLoanWithRetry(loanId: number, attempt: number = 1): Promise<void> {
    try {
      this.logger.debug(`🔍 Intentando procesar loan ID=${loanId} (intento ${attempt}/${this.maxProcessingAttempts})...`);
      
      await this.processLoanInstallment(loanId);
      
      this.logger.log(`✅ Procesamiento completado para loan ${loanId}`);

    } catch (error) {
      this.logger.error(`❌ Error procesando loan ${loanId} (intento ${attempt}):`, error);

      if (attempt < this.maxProcessingAttempts) {
        // Esperar y reintentar
        const retryDelay = attempt * 2000; // Backoff exponencial
        this.logger.warn(`🔄 Reintentando loan ${loanId} en ${retryDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await this.processLoanWithRetry(loanId, attempt + 1);
      } else {
        this.logger.error(`🚨 Máximo de intentos alcanzado para loan ${loanId}. Abortando...`);
        // Aquí podrías enviar el mensaje a una cola de dead-letter
      }
    }
  }

  private async processLoanInstallment(loanId: number): Promise<void> {
    this.logger.debug(`🔍 Buscando loan con ID=${loanId} (activo)...`);
    
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId, isActive: true },
      include: { 
        installments: {
          orderBy: { sequence: 'desc' },
          take: 1 // Solo la última cuota para verificar
        },
        paymentFrequency: true 
      },
    });

    if (!loan) {
      this.logger.warn(`⚠️ Loan ${loanId} no existe o está inactivo`);
      return;
    }

    // Verificar si ya tiene cuotas y cuál es la última
    const hasInstallments = loan.installments && loan.installments.length > 0;
    const lastInstallment = hasInstallments ? loan.installments[0] : null;
    const lastSequence = lastInstallment ? lastInstallment.sequence : 0;

    this.logger.log(`✅ Loan ${loanId} encontrado. Cuotas existentes: ${lastSequence}`);

    // Crear próxima cuota
    this.logger.log(`🔄 Creando próxima cuota para loan ${loanId}...`);
    const installment = await this.installmentsService.createNextInstallment(loanId);

    this.logger.log(`💰 Nueva cuota creada (ID=${installment.id}, secuencia=${installment.sequence})`);

    // Calcular el delay basado en la frecuencia de pago real
    const nextDelay = this.calculateNextDelay(loan.paymentFrequency.name);
    
    this.logger.log(`🔁 Re-publicando Loan ${loanId} con delay de ${nextDelay / 1000} segundos...`);
    
    await this.rabbitMqService.publishWithDelay(
      envs.rabbitMq.loanInstallmentsQueue,
      { loanId },
      nextDelay
    );

    this.logger.log(`✅ Loan ${loanId} reprogramado exitosamente`);
  }

  private calculateNextDelay(paymentFrequency: string): number {
    const freq = paymentFrequency.toUpperCase();
    
    if (freq.includes('DIARIA') || freq.includes('DAILY')) {
      return 24 * 60 * 60 * 1000; // 1 día
    } else if (freq.includes('SEMANAL') || freq.includes('WEEKLY')) {
      return 7 * 24 * 60 * 60 * 1000; // 7 días
    } else if (freq.includes('QUINCENAL') || freq.includes('BIWEEKLY')) {
      return 15 * 24 * 60 * 60 * 1000; // 15 días
    } else if (freq.includes('MENSUAL') || freq.includes('MONTHLY')) {
      return 30 * 24 * 60 * 60 * 1000; // 30 días
    } else {
      return this.processingInterval; // Default al intervalo de procesamiento
    }
  }

  async startConsuming(): Promise<void> {
    if (this.isConsuming) {
      this.logger.warn('⚠️ El consumo ya está iniciado');
      return;
    }

    try {
      this.logger.log('🔄 Iniciando consumo de mensajes...');
      
      await this.rabbitMqService.consume(
        envs.rabbitMq.loanInstallmentsQueue,
        (msg) => {
          this.handleMessage(msg).catch(error => {
            this.logger.error('❌ Error no manejado en processMessage:', error);
          });
        }
      );

      this.isConsuming = true;
      this.logger.log('✅ Consumo de mensajes iniciado correctamente');

    } catch (error) {
      this.logger.error('❌ Error iniciando consumo:', error);
      this.isConsuming = false;
      
      // Reintentar después de un tiempo
      setTimeout(() => {
        this.logger.warn('🔄 Reintentando iniciar consumo...');
        this.startConsuming();
      }, 5000);
    }
  }

  // Método para detener el consumo (útil para shutdowns graceful)
  async stopConsuming(): Promise<void> {
    this.logger.log('🛑 Deteniendo consumo de mensajes...');
    this.isConsuming = false;
    // Nota: La desconexión real se maneja en RabbitMqService.onModuleDestroy
  }

  // Método para verificar estado del worker
  getStatus(): { isConsuming: boolean; queue: string } {
    return {
      isConsuming: this.isConsuming,
      queue: envs.rabbitMq.loanInstallmentsQueue
    };
  }
}