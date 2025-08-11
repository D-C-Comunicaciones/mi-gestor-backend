import { Module } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CollectorsController } from './collectors.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CollectorsController],
  providers: [CollectorsService],
  exports: [CollectorsService],
})
export class CollectorsModule {}
