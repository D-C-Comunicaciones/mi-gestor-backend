import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService], // ✅ Asegúrate de que esté exportado
})
export class NotesModule {}
