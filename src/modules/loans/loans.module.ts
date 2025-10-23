import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { ChangesModule } from '@modules/changes/changes.module';
import { InstallmentsModule } from '@modules/installments/installments.module';
import { NotesModule } from '@modules/notes/notes.module';
import { FixedFeesStrategy, OnlyInterestsStrategy } from './strategies';
import { LoanStrategyFactory } from './strategies/factories';
import { TranslationsModule } from '@modules/translations/translations.module';
import { InstallmentsService } from '@modules/installments/installments.service';
import { LoanOverdueWorker } from './workers/loan-overdue-worker';
import { LoanInstallmentWorker } from './workers/loan-installments-worker';
import { RabbitMqModule } from '@infraestructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    PrismaModule,
    ChangesModule,
    InstallmentsModule,
    NotesModule,
    TranslationsModule,
    RabbitMqModule  
  ],
  controllers: [LoansController],
  providers: [
    LoansService,
    LoanStrategyFactory,
    FixedFeesStrategy,
    OnlyInterestsStrategy,
    LoanInstallmentWorker,
    LoanOverdueWorker,
    InstallmentsService,
  ],
  exports: [LoansService],
})
export class LoansModule {}
