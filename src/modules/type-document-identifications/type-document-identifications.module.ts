import { Module } from '@nestjs/common';
import { TypeDocumentIdentificationsService } from './type-document-identifications.service';
import { TypeDocumentIdentificationsController } from './type-document-identifications.controller';

@Module({
  controllers: [TypeDocumentIdentificationsController],
  providers: [TypeDocumentIdentificationsService],
})
export class TypeDocumentIdentificationsModule {}
