import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { ChangesService } from '@modules/changes/changes.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountPaginationDto } from './dto';
import { Request } from 'express';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly changesService: ChangesService,
  ) { }

  async create(dto: CreateDiscountDto, req) {
    // Usuario extraído del JWT
    const user = req['user'];
    if (!user || !user.userId) {
      throw new BadRequestException('Usuario no autenticado o información de usuario incompleta');
    }

    // Validar que el monto sea mayor a cero
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del descuento debe ser mayor a cero');
    }

    return await this.prisma.$transaction(async tx => {
      // Buscar la moratoria
      const moratory = await tx.moratoryInterest.findUnique({ 
        where: { id: dto.moratoryId } 
      });
      
      if (!moratory) {
        throw new BadRequestException('Interés moratorio no encontrado');
      }
      
      if (moratory.amount <= 0) {
        throw new BadRequestException('No existe interés moratorio generado para aplicar descuento');
      }

      // Validar que el descuento no exceda el monto moratorio
      const discountAmount = new Prisma.Decimal(dto.amount);
      const moratoryAmount = new Prisma.Decimal(moratory.amount);
      
      if (discountAmount.greaterThan(moratoryAmount)) {
        throw new BadRequestException(
          `El descuento (${dto.amount}) no puede ser mayor al interés moratorio existente (${moratory.amount})`
        );
      }

      // Aplicar descuento a la moratoria
      const newMoratoryAmount = moratoryAmount.minus(discountAmount);
      
      await tx.moratoryInterest.update({
        where: { id: dto.moratoryId },
        data: { amount: newMoratoryAmount.toNumber() },
      });

      // Crear descripción completa
      const baseDescription = dto.description ? `${dto.description}. ` : '';
      const appliedDescription = `DESCRIPCIÓN APLICADA POR EL SISTEMA: descuento de ${dto.amount} aplicado a interés moratorio ID ${dto.moratoryId}, generado por: ${user.userId} - ${user.email || 'N/A'}`;

      // Crear registro de descuento
      const discount = await tx.discount.create({
        data: {
          discountTypeId: dto.discountTypeId,
          moratoryId: dto.moratoryId,
          description: baseDescription + appliedDescription,
          amount: discountAmount,
          createdBy: user.userId,
        },
      });

      return this.convertDiscountToPlain(discount);
    });
  }

  // ---------------- FIND ALL DISCOUNTS ----------------
  async findAll(paginationDto: DiscountPaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const where: Prisma.DiscountWhereInput = {};

    // Filtros específicos
    if (paginationDto?.moratoryId) where.moratoryId = paginationDto.moratoryId;
    if (paginationDto?.discountTypeId) where.discountTypeId = paginationDto.discountTypeId;

    // Búsqueda por descripción
    if (paginationDto?.search) {
      where.description = {
        contains: paginationDto.search,
        mode: 'insensitive'
      };
    }

    const totalItems = await this.prisma.discount.count({ where });

    const lastPage = Math.ceil(totalItems / limit || 1);
    if (page > lastPage && totalItems > 0) {
      throw new BadRequestException(`La página #${page} no existe`);
    }

    const discounts = await this.prisma.discount.findMany({
      where,
      include: {
        discountType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        moratory: {
          select: {
            id: true,
            amount: true,
            installmentId: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      discounts: discounts.map(d => this.convertDiscountToPlain(d)),
      meta: {
        totalItems,
        page,
        lastPage: Math.ceil(totalItems / limit),
        limit,
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ---------------- UTIL ----------------
  private convertDiscountToPlain(obj: any): any {
    const jsonString = JSON.stringify(obj, (key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        value.constructor?.name === 'Decimal'
      ) {
        return value.toNumber();
      }
      return value;
    });

    return JSON.parse(jsonString);
  }
}