import { Global, Module } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ChangesController } from './changes.controller';

@Global()
@Module({
  controllers: [ChangesController],
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
