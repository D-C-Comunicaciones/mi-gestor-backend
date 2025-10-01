import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { CreateNoteDto } from './dto';
import { PaginationDto } from '@common/dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Crear una nueva nota asociada a cualquier modelo
   */
  async create(createNoteDto: CreateNoteDto, req) {
    const user = req['user'];
    if (!user?.userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    this.logger.log(
      `Creando nota para modelo ${createNoteDto.model} con ID ${createNoteDto.modelId}`,
    );

    // Validar que el usuario exista en BD (evita FK P2003)
    await this.validateModelExists('user', user.userId);

    // Validar que el registro del modelo destino exista (dinámico)
    await this.validateModelExists(createNoteDto.model, createNoteDto.modelId);

    const note = await this.prisma.note.create({
      data: {
        modelId: createNoteDto.modelId,
        model: createNoteDto.model,
        content: createNoteDto.content,
        createdBy: user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`✅ Nota creada exitosamente con ID: ${note.id}`);
    return note;
  }

  /**
   * Obtener notas por modelo y ID del modelo
   */
  async findByModel(model: string, modelId: number, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const offset = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: { model, modelId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.note.count({ where: { model, modelId } }),
    ]);

    const meta = {
      total,
      page,
      lastPage: Math.ceil(total / limit),
      limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };

    return { notes, meta };
  }

  /**
   * Obtener todas las notas (admin)
   */
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const offset = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.note.count(),
    ]);

    const meta = {
      total,
      page,
      lastPage: Math.ceil(total / limit),
      limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };

    return { notes, meta };
  }

  /**
   * Obtener una nota específica por ID
   */
  async findOne(id: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException(`Nota con ID ${id} no encontrada`);
    }

    return note;
  }

  /**
   * Validar que el modelo y el ID existen de forma dinámica
   */
  private async validateModelExists(model: string, modelId: number | string): Promise<void> {
    const lowerModel = model.toLowerCase();
    const delegate = (this.prisma as any)[lowerModel];

    if (!delegate || typeof delegate.findUnique !== 'function') {
      throw new BadRequestException(`El modelo "${model}" no está registrado en Prisma`);
    }

    if (!modelId) {
      throw new BadRequestException(`El ID del modelo "${model}" es requerido`);
    }

    // Detectar clave única automáticamente para User u otros modelos
    const where: any = {};
    if (lowerModel === 'user' && isNaN(Number(modelId))) {
      where.email = modelId;
    } else {
      where.id = Number(modelId);
    }

    const record = await delegate.findUnique({
      where,
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException(`No existe un ${model} con el identificador proporcionado`);
    }

    this.logger.debug(`✓ Validación exitosa: ${model} con identificador ${modelId} existe`);
  }

}
