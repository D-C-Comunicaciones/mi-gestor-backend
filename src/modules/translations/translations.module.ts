import { Global, Module } from '@nestjs/common';
import { TranslationService } from './translations.service';

@Global()
@Module({
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationsModule {}
