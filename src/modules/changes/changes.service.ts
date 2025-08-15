import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { AuditPaginationDto } from './dto';

@Injectable()
export class ChangesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: AuditPaginationDto) {
    const { action, model, page = 1, limit = 10 } = dto;

    const where: any = {};
    if (action) where.action = action;
    if (model) where.model = model;

    const total = await this.prisma.change.count({ where });
    const lastPage = Math.ceil(total / (limit || 1));

    if (page > lastPage && total > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const rawChanges = await this.prisma.change.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    return {
      rawChanges,
      meta: {
        total,
        page,
        lastPage,
        limit,
        hasNextPage: page < lastPage,
      },
    };
  }

  async getChanges(modelName: string, modelId: number) {
    // Normalizar al nombre de modelo Prisma (primera letra mayúscula, resto igual)
    const normalizedModel =
      modelName.length > 0
        ? modelName.charAt(0).toUpperCase() + modelName.slice(1)
        : modelName;

    const [createRecord, lastUpdateRecord] = await Promise.all([
      this.prisma.change.findFirst({
        where: { model: normalizedModel, action: 'create', modelId },
        orderBy: { timestamp: 'asc' },
        take: 1,
      }),
      this.prisma.change.findFirst({
        where: { model: normalizedModel, action: 'update', modelId },
        orderBy: { timestamp: 'desc' },
        take: 1,
      }),
    ]);

    return {
      create: createRecord,
      lastUpdate: lastUpdateRecord,
    };
  }
}