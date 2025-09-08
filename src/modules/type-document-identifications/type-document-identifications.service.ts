import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTypeDocumentIdentificationDto } from './dto/create-type-document-identification.dto';
import { UpdateTypeDocumentIdentificationDto } from './dto/update-type-document-identification.dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class TypeDocumentIdentificationsService {
  constructor(private readonly prisma: PrismaService) { }

  // create(createTypeDocumentIdentificationDto: CreateTypeDocumentIdentificationDto) {
  //   return 'This action adds a new typeDocumentIdentification';
  // }

  async findAll() {
    const rawTypeDocumentIdentifications = await this.prisma.typeDocumentIdentification.findMany({ where: { isActive: true } });

    if (!rawTypeDocumentIdentifications || rawTypeDocumentIdentifications.length === 0) {
      throw new BadRequestException('No type document identifications found');
    }
    
    return rawTypeDocumentIdentifications;
  }

//   findOne(id: number) {
//     const typeDocumentIdentification = this.prisma.typeDocumentIdentification.findUnique({
//       where: { id },
//     });
//     return typeDocumentIdentification;
//   }
// 
//   update(id: number, updateTypeDocumentIdentificationDto: UpdateTypeDocumentIdentificationDto) {
//     return `This action updates a #${id} typeDocumentIdentification`;
//   }
// 
//   remove(id: number) {
//     return `This action removes a #${id} typeDocumentIdentification`;
//   }
}
