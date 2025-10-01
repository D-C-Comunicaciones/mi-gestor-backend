import { Module } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { InstallmentsModule } from '@modules/installments/installments.module';
import { NotesService } from '@modules/notes/notes.service';

@Module({
  imports: [InstallmentsModule],
  controllers: [LoansController],
  providers: [LoansService, NotesService, PrismaService],
  exports: [LoansService],
})
export class LoansModule {}
