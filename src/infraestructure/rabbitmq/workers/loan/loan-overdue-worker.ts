import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { RabbitMqService } from '@infraestructure/rabbitmq/rabbitmq.service';
import { envs } from '@config/envs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class LoanOverdueWorker implements OnModuleInit {
  private readonly logger = new Logger(LoanOverdueWorker.name);
  private isConsuming = false;
  private processingLoans = new Set<number>(); // Control de préstamos en procesamiento

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService
  ) { }

  async onModuleInit() {
    this.logger.log('🚀 Iniciando LoanOverdueWorker...');
    await this.rabbitMqService.waitForConnection();
    await this.rabbitMqService.assertQueue(envs.rabbitMq.loanOverdueQueue);
    this.logger.log(`✅ Cola asegurada: ${envs.rabbitMq.loanOverdueQueue}`);
    await this.startConsuming();
  }

  private async handleMessage(msg: any) {
    if (!msg) return;
    
    const content = msg.content?.toString() ?? '';
    const { loanId } = JSON.parse(content);
    
    if (!loanId) {
      this.logger.warn('⚠️ Mensaje sin loanId, se descarta');
      return;
    }

    // Evitar procesamiento concurrente del mismo préstamo
    if (this.processingLoans.has(loanId)) {
      this.logger.warn(`⚠️ Préstamo ${loanId} ya está siendo procesado, se omite`);
      return;
    }

    this.processingLoans.add(loanId);
    
    try {
      this.logger.log(`📩 Procesando loanId=${loanId}`);

      // Verificar el préstamo y sus estados
      const loan = await this.prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          penaltyRate: true,
          loanStatus: true
        }
      });

      if (!loan) {
        this.logger.warn(`⚠️ No se encontró el préstamo loanId=${loanId}`);
        return;
      }

      // Verificar si el préstamo está en un estado final - NO PROCESAR NI REPUBLICAR
      const finalStates = ['Paid', 'Cancelled', 'Refinanced'];
      if (finalStates.includes(loan.loanStatus.name)) {
        this.logger.log(`🔒 Préstamo ${loanId} está en estado final: ${loan.loanStatus.name}. No se procesa ni re-publica.`);
        return;
      }

      // Obtener fecha actual para comparación
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const installments = await this.prisma.installment.findMany({
        where: { loanId },
        include: { status: true }
      });

      if (!installments.length) {
        this.logger.warn(`⚠️ No se encontraron cuotas para loanId=${loanId}`);
        return;
      }

      this.logger.log(`📊 Analizando ${installments.length} cuotas para loanId=${loanId}`);

      const penaltyRateValue = loan.penaltyRate?.value ?? 0;
      const penaltyRateDecimal = new Decimal(penaltyRateValue).div(100);

      // Buscar status de cuotas
      const [pendingStatus, overdueStatus] = await Promise.all([
        this.prisma.installmentStatus.findUnique({ where: { name: 'Pending' } }),
        this.prisma.installmentStatus.findUnique({ where: { name: 'Overdue Paid' } })
      ]);

      if (!pendingStatus || !overdueStatus) {
        this.logger.error('❌ No se encontraron los estados necesarios para installments');
        return;
      }

      // Estados del loan
      const loanStatuses = await this.prisma.loanStatus.findMany({
        where: { name: { in: ['Outstanding Balance', 'Overdue', 'Up to Date'] } }
      });

      const outstandingBalanceId = loanStatuses.find(s => s.name === 'Outstanding Balance')?.id;
      const overdueId = loanStatuses.find(s => s.name === 'Overdue')?.id;
      const upToDateId = loanStatuses.find(s => s.name === 'Up to Date')?.id;

      // Contadores para determinar estado del loan
      let cuotasVencidas = 0;
      let cuotasConSaldoPendiente = 0;
      let cuotasPagadas = 0;

      // Procesar cada cuota
      for (const installment of installments) {
        const total = Number(installment.totalAmount);
        const paid = Number(installment.paidAmount);
        const dueDateString = installment.dueDate.toISOString().split('T')[0];
        const isOverdue = todayString > dueDateString;

        this.logger.log(
          `🔎 Cuota ${installment.id}: dueDate=${dueDateString}, paid=${paid}/${total}, isPaid=${installment.isPaid}, paidAt=${installment.paidAt}, isOverdue=${isOverdue}`
        );

        // 1. CUOTA COMPLETAMENTE PAGADA - No hacer nada
        if (installment.isPaid && paid >= total) {
          cuotasPagadas++;
          this.logger.log(`✅ Cuota ${installment.id} completamente pagada`);
          continue;
        }

        // 2. CUOTA CON SALDO PENDIENTE (isPaid: true, paidAmount < totalAmount, paidAt existe)
        if (installment.isPaid && paid < total && installment.paidAt) {
          cuotasConSaldoPendiente++;
          this.logger.log(`⚠️ Cuota ${installment.id} con saldo pendiente (pagada parcialmente)`);

          // Marcar como pending (no importa si la fecha pasó, si isPaid=true es saldo pendiente)
          if (installment.statusId !== pendingStatus.id) {
            await this.prisma.installment.update({
              where: { id: installment.id },
              data: { statusId: pendingStatus.id }
            });
            this.logger.log(`📝 Cuota ${installment.id} ➝ PENDING (saldo pendiente)`);
          }
        }
        // 3. CUOTA VENCIDA (isPaid: false y fecha pasó)
        else if (!installment.isPaid && isOverdue) {
          cuotasVencidas++;
          this.logger.warn(`⛔ Cuota ${installment.id} VENCIDA (${dueDateString}) - No pagada`);

          // Marcar como overdue
          if (installment.statusId !== overdueStatus.id) {
            await this.prisma.installment.update({
              where: { id: installment.id },
              data: { statusId: overdueStatus.id }
            });
            this.logger.log(`📝 Cuota ${installment.id} ➝ OVERDUE`);
          }

          // Generar/actualizar interés moratorio
          await this.processLateFee(installment.id, loan.loanAmount, penaltyRateDecimal, todayString);

          // Si tiene abono parcial (pero isPaid=false), también cuenta como saldo pendiente
          if (paid > 0 && paid < total) {
            cuotasConSaldoPendiente++;
            this.logger.log(`⚠️ Cuota ${installment.id} vencida CON abono parcial`);
          }
        }
        // 4. CUOTA SIN VENCER Y SIN PAGOS
        else {
          this.logger.log(`⏳ Cuota ${installment.id} sin vencer y sin pagos`);
        }
      }

      // Determinar estado del loan basado en el análisis de cuotas
      // PRIORIDAD: Overdue > Outstanding Balance > Up to Date
      let nuevoEstadoLoan: number | null = null;
      let estadoDescripcion = '';

      if (cuotasVencidas > 0 && overdueId) {
        // PRIORIDAD 1: Si hay cuotas vencidas, el loan está en OVERDUE
        nuevoEstadoLoan = overdueId;
        estadoDescripcion = 'OVERDUE';
      } else if (cuotasConSaldoPendiente > 0 && outstandingBalanceId) {
        // PRIORIDAD 2: Si no hay mora pero hay saldos pendientes, OUTSTANDING BALANCE
        nuevoEstadoLoan = outstandingBalanceId;
        estadoDescripcion = 'OUTSTANDING BALANCE';
      } else if (upToDateId) {
        // PRIORIDAD 3: Si no hay mora ni saldos pendientes, UP TO DATE
        nuevoEstadoLoan = upToDateId;
        estadoDescripcion = 'UP TO DATE';
      }

      this.logger.log(`📊 Resumen loan ${loanId}: ${cuotasPagadas} pagadas, ${cuotasConSaldoPendiente} con saldo pendiente, ${cuotasVencidas} vencidas`);
      this.logger.log(`📌 Estado del loan: ${estadoDescripcion}`);

      // Actualizar estado del loan si es necesario
      if (nuevoEstadoLoan && loan.loanStatusId !== nuevoEstadoLoan) {
        await this.prisma.loan.update({
          where: { id: loan.id },
          data: { loanStatusId: nuevoEstadoLoan }
        });
        this.logger.log(`🔄 Estado del loan actualizado: ${estadoDescripcion}`);
      }

      // RE-PUBLICAR mensaje para seguir monitoreando préstamos activos
      const updatedLoan = await this.prisma.loan.findUnique({
        where: { id: loanId },
        include: { loanStatus: true }
      });

      if (updatedLoan && !finalStates.includes(updatedLoan.loanStatus.name)) {
        // Publicar con delay de 24 horas para el próximo chequeo
        await this.rabbitMqService.publishWithDelay(
          envs.rabbitMq.loanOverdueQueue,
          { loanId },
          60 * 60 * 24 * 1000 // 24 horas en ms
        );
        this.logger.debug(`📤 Mensaje re-publicado para loanId=${loanId} (próximo chequeo en 24h)`);
      } else {
        this.logger.log(`🔒 No se re-publica mensaje para loanId=${loanId} - estado final: ${updatedLoan?.loanStatus.name}`);
      }

      this.logger.log(`✅ Procesamiento completado para loanId=${loanId}`);

    } catch (error) {
      this.logger.error(`❌ Error procesando loanId=${loanId}:`, error);
    } finally {
      this.processingLoans.delete(loanId);
    }
  }

  private async processLateFee(
    installmentId: number,
    loanAmount: Decimal,
    penaltyRate: Decimal,
    todayString: string
  ) {
    // Calcular interés diario
    const dailyInterest = loanAmount.mul(penaltyRate).div(30);

    // Crear un nuevo registro por cada día de atraso detectado
    await this.prisma.moratoryInterest.create({
      data: {
        installmentId,
        amount: dailyInterest.toNumber(),
        daysLate: 1, // cada registro representa un día
        paidAmount: new Decimal(0),
        isPaid: false,
        moratoryInterestStatusId: 1, // "Unpaid" (asegúrate que existe ese status)
      },
    });

    this.logger.log(
      `💰 Interés moratorio generado installmentId=${installmentId} -> ${dailyInterest.toFixed(2)}`
    );
  }

  private async startConsuming() {
    if (this.isConsuming) return;

    await this.rabbitMqService.consume(
      envs.rabbitMq.loanOverdueQueue,
      async (msg, ack, nack) => {
        try {
          await this.handleMessage(msg);
          ack(); // ✅ Confirmamos el mensaje procesado
        } catch (err) {
          this.logger.error('❌ Error procesando mensaje:', err);
          nack(false); // ❌ No reencolamos para evitar bucles infinitos
        }
      }
    );

    this.isConsuming = true;
  }
}