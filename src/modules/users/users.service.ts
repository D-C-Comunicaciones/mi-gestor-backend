import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto';
import { envs } from '@config/envs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  private sanitize(user: any) {
    if (!user) return user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (exists) throw new ConflictException('Email ya registrado');

    if (!dto.password) throw new ConflictException('La contraseña es requerida');
    
    const hash = await bcrypt.hash(dto.password, Number(envs.bcryptSaltRounds) || 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
      },
    });

    return this.sanitize(user);
    
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(u => this.sanitize(u));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    let password: string | undefined;
    if (dto.password) {
      password = await bcrypt.hash(dto.password, Number(envs.bcryptSaltRounds) || 10);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ?? user.email,
        name: dto.name ?? user.name,
        ...(password && { password }),
      },
    });
    return this.sanitize(updated);
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
