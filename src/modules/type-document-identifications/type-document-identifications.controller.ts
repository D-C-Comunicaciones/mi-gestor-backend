import { Controller, Get } from '@nestjs/common';
import { TypeDocumentIdentificationsService } from './type-document-identifications.service';
import { TypeDocumentIdentificationListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseTypeDocumentIdentificationDto } from './dto';

@Controller('type-document-identifications')
export class TypeDocumentIdentificationsController {
  constructor(private readonly typeDocumentIdentificationsService: TypeDocumentIdentificationsService) { }

  // @Post()
  // create(@Body() createTypeDocumentIdentificationDto: CreateTypeDocumentIdentificationDto) {
  //   return this.typeDocumentIdentificationsService.create(createTypeDocumentIdentificationDto);
  // }

  @Get()
  async findAll(): Promise<TypeDocumentIdentificationListResponse> {
    const rawTypeDocumentIdentifications = await this.typeDocumentIdentificationsService.findAll();
    const typeDocumentIdentifications = plainToInstance(
      ResponseTypeDocumentIdentificationDto,
      rawTypeDocumentIdentifications
    );

    return {
      customMessage: 'Listado de tipos de documentos de identificación',
      typeDocumentIdentifications
    };
  }

  //   @Get(':id')
  //   findOne(@Param('id') id: string) {
  //     return this.typeDocumentIdentificationsService.findOne(+id);
  //   }
  // 
  //   @Patch(':id')
  //   update(@Param('id') id: string, @Body() updateTypeDocumentIdentificationDto: UpdateTypeDocumentIdentificationDto) {
  //     return this.typeDocumentIdentificationsService.update(+id, updateTypeDocumentIdentificationDto);
  //   }
  // 
  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.typeDocumentIdentificationsService.remove(+id);
  //   }
}
