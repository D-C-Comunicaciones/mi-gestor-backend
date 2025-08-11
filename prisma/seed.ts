import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function main() {
  // Seed Zones
  await prisma.zone.createMany({
    data: [
      { name: 'Norte', code: 'NRT' },
      { name: 'Centro', code: 'CTR' },
    ],
  });

  // Seed TypeDocumentIdentification
  await prisma.typeDocumentIdentification.createMany({
    data: [
      { name: 'Cédula de Ciudadanía', code: 'CC' },
      { name: 'Tarjeta de Identidad', code: 'TI' },
    ],
  });

  // Seed Genders
  await prisma.gender.createMany({
    data: [
      { name: 'Masculino', code: 'M' },
      { name: 'Femenino', code: 'F' },
    ],
  });

  // Seed Roles
  await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Administrador con todos los permisos' },
      { name: 'collector', description: 'Cobrador con permisos limitados' },
    ],
  });

  // Get role IDs
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const collectorRole = await prisma.role.findUnique({ where: { name: 'collector' } });

  // Seed Permissions
  await prisma.permission.createMany({
    data: [
      { name: 'all.permissions', description: 'Permiso total para admin' },
      { name: 'create.payments', description: 'Permiso para crear pagos' },
    ],
  });

  // Get permission IDs
  const allPermissions = await prisma.permission.findUnique({ where: { name: 'all.permissions' } });
  const createPayments = await prisma.permission.findUnique({ where: { name: 'create.payments' } });

  // Assign all permissions to admin
  if (adminRole && allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: allPermissions.id,
        isActive: true,
      },
    });
  }

  // Assign create.payments permission to collector
  if (collectorRole && createPayments) {
    await prisma.rolePermission.create({
      data: {
        roleId: collectorRole.id,
        permissionId: createPayments.id,
        isActive: true,
      },
    });
  }

  // Seed Users (passwords hashed)
  const hashedPasswordAdmin = await bcrypt.hash('AdminPass123', 10);
  const hashedPasswordCollector = await bcrypt.hash('CollectorPass123', 10);

  await prisma.user.createMany({
    data: [
      { email: 'admin@example.com', password: hashedPasswordAdmin, name: 'Admin User', roleId: adminRole?.id },
      { email: 'collector@example.com', password: hashedPasswordCollector, name: 'Collector User', roleId: collectorRole?.id },
    ],
  });

  // Seed Customers
  const typeDocs = await prisma.typeDocumentIdentification.findMany();
  const genders = await prisma.gender.findMany();
  const zones = await prisma.zone.findMany();

  await prisma.customer.createMany({
    data: [
      {
        name: 'Juan Pérez',
        phone: '3001234567',
        address: 'Calle 123 #45-67',
        typeDocumentId: typeDocs[0].id,
        documentNumber: '1234567890',
        genderId: genders[0].id,
        zoneId: zones[0].id,
      },
      {
        name: 'María Gómez',
        phone: '3009876543',
        address: 'Carrera 45 #67-89',
        typeDocumentId: typeDocs[1].id,
        documentNumber: '0987654321',
        genderId: genders[1].id,
        zoneId: zones[1].id,
      },
    ],
  });

  // Seed Credits (loans)
  const customers = await prisma.customer.findMany();
  const paymentFreq = await prisma.paymentFrequency.findFirst() || 
    await prisma.paymentFrequency.create({ data: { name: 'MONTHLY', isActive: true } });
  const creditType = await prisma.creditType.findFirst() || 
    await prisma.creditType.create({ data: { name: 'CUOTA_FIJA', isActive: true } });
  const creditStatus = await prisma.creditStatus.findFirst() || 
    await prisma.creditStatus.create({ data: { name: 'ACTIVO', isActive: true } });

  await prisma.credit.createMany({
    data: [
      {
        customerId: customers[0].id,
        principal: 1000000.00,
        remainingBalance: 900000.00,
        interestRate: 0.05,
        paymentAmount: 100000.00,
        term: 10,
        paymentFrequencyId: paymentFreq.id,
        creditTypeId: creditType.id,
        creditStatusId: creditStatus.id,
        startDate: new Date(),
        isActive: true,
      },
      {
        customerId: customers[1].id,
        principal: 2000000.00,
        remainingBalance: 1800000.00,
        interestRate: 0.06,
        paymentAmount: 200000.00,
        term: 12,
        paymentFrequencyId: paymentFreq.id,
        creditTypeId: creditType.id,
        creditStatusId: creditStatus.id,
        startDate: new Date(),
        isActive: true,
      },
    ],
  });

  const logger  = new Logger('prisma/seed.ts');

  logger.log('Seed completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });