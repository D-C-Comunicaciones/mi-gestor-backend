import { Module } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { ConfigurationsController } from './configurations.controller';
import { PrismaModule } from '@infraestructure/prisma/prisma.module';

@Module({
  imports: [
      PrismaModule,
    ],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
})
export class ConfigurationsModule {}
