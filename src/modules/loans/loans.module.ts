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

@Module({
  imports: [
    PrismaModule,
    ChangesModule,
    InstallmentsModule,
    NotesModule,
    TranslationsModule,
  ],
  controllers: [LoansController],
  providers: [
    LoansService,
    LoanStrategyFactory,
    FixedFeesStrategy,
    OnlyInterestsStrategy,
  ],
  exports: [LoansService],
})
export class LoansModule {}
