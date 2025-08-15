import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaService } from '@infraestructure/prisma/prisma.service';
import { UsersService } from '@modules/users/users.service';
import { ChangesService } from '@modules/changes/changes.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService, UsersService, ChangesService],
  exports: [CustomersService],
})
export class CustomersModule {}
