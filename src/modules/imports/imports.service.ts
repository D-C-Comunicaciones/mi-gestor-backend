import { PaginationDto } from '@common/dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';

@Injectable()
export class ImportsService {
  constructor(private readonly prismaService: PrismaService) { }

  async findAllCustomersImports(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    // 👇 Filtro para traer solo importaciones de clientes (case-insensitive)
    const where = {
      modelName: {
        equals: 'customers',
        mode: 'insensitive' as const,
      },
    };

    const totalItems = await this.prismaService.importHistory.count({ where });
    const lastPage = Math.ceil(totalItems / limit || 1);

    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const imports = await this.prismaService.importHistory.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        importHistoryStatus: true,
      },
    });

    const Imports = imports.map((imp) => ({
      startedAt: imp.startedAt,
      fileName: imp.fileName,
      totalRecords: imp.totalRecords,
      successfulRecords: imp.successfulRecords,
      errorRecords: imp.errorRecords,
      status: imp.importHistoryStatus.name,
    }));

    return {
      Imports,
      meta: {
        total: totalItems,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage,
      },
    };
  }

  async findOne(id: number) {
    const customerImport = await this.prismaService.importHistory.findUnique({
      where: { id },
      include: {
        importHistoryStatus: true,
      },
    });

    if (!customerImport) {
      throw new NotFoundException(`No se encontró la importación con id=${id}`);
    }

    return {
      ...customerImport,
      startedAt: customerImport.startedAt ? format(new Date(customerImport.startedAt), 'yyyy-MM-dd HH:mm:ss') :
              customerImport.startedAt ? format(new Date(customerImport.startedAt) , 'yyyy-MM-dd HH:mm:ss') : '',
    };
  }

}
