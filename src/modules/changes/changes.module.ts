import { Global, Module } from '@nestjs/common';
import { ChangesService } from './changes.service';

@Global()
@Module({
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
