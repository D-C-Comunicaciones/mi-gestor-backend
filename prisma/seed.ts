import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --------------------------
  // 1️⃣ Seed Catálogos
  // --------------------------
  await prisma.zone.createMany({
    data: [
      { name: 'Norte', code: 'NRT' },
      { name: 'Centro', code: 'CTR' },
    ],
  });

  await prisma.typeDocumentIdentification.createMany({
    data: [
      { name: 'Cédula de Ciudadanía', code: 'CC' },
      { name: 'Tarjeta de Identidad', code: 'TI' },
    ],
  });

  await prisma.gender.createMany({
    data: [
      { name: 'Masculino', code: 'M' },
      { name: 'Femenino', code: 'F' },
    ],
  });

  await prisma.loanType.createMany({
    data: [
      { name: 'fixed_fees' },
      { name: 'only_interests' },
    ],
  });

  await prisma.paymentFrequency.createMany({
    data: [
      { name: 'Daily' },
      { name: 'Weekly' },
      { name: 'Monthly' },
      { name: 'Biweekly' },
      { name: 'Minute' },
    ],
  });

  await prisma.loanStatus.createMany({
    data: [
      { name: 'Al día' },
      { name: 'En Mora' },
      { name: 'Pagado' },
      { name: 'Cancelado' },
      { name: 'Refinanciado' },
    ],
  });

  await prisma.paymentType.createMany({
    data: [
      { name: 'Cuota' },
      { name: 'Interés Préstamo' },
      { name: 'Abono' },
      { name: 'Interés Moratorio' },
    ],
  });

  await prisma.statusInstallment.createMany({
    data: [
      { name: 'Pending', description: 'Saldo en Cuota pendiente' },
      { name: 'Paid', description: 'Saldo en Cuota pagada' },
      { name: 'Overdue Paid', description: 'pago de intereses moratorios' },
      { name: 'Created', description: 'Cuota generada' },
    ],
  });

  await prisma.discountType.createMany({
    data: [
      { name: 'Moratorios', description: 'Descuento de intereses moratorios' },
      { name: 'Corrientes', description: 'Descuento de intereses corrientes' },
    ],
  });

  await prisma.percentageDiscount.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      name: `${i + 1}%`,
      value: i + 1,
    })),
  });

  await prisma.interestRate.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      value: (i + 1) / 100,
    })),
  });

  await prisma.term.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      value: i + 1,
    })),
  });

  await prisma.penaltyRate.createMany({
    data: [
      { name: 'Mora legal máxima', value: 0.05 },
      { name: 'Mora estándar', value: 0.03 },
    ],
  });

  await prisma.gracePeriod.createMany({
    data: [
      { name: '15 días', days: 15 },
      { name: '1 mes', days: 30 },
      { name: '2 meses', days: 60 },
      { name: '3 meses', days: 90 },
      { name: '4 meses', days: 120 },
      { name: '5 meses', days: 150 },
      { name: '6 meses', days: 180 },
      { name: '7 meses', days: 210 },
      { name: '8 meses', days: 240 },
      { name: '9 meses', days: 270 },
      { name: '10 meses', days: 300 },
      { name: '11 meses', days: 330 },
      { name: '1 año', days: 365 },
    ],
  });

  // --------------------------
  // 2️⃣ Seed Roles y Permisos
  // --------------------------
  await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Administrador con todos los permisos' },
      { name: 'collector', description: 'Cobrador con permisos limitados' },
    ],
  });

  await prisma.permission.createMany({
    data: [
      { name: 'all.permissions', description: 'Permiso total para admin' },
      { name: 'create.payments', description: 'Permiso para crear pagos' },
      { name: 'view.customers', description: 'Ver clientes' },
      { name: 'update.collectors', description: 'Actualizar cobradores' },
    ],
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const collectorRole = await prisma.role.findUnique({ where: { name: 'collector' } });
  const allPermissions = await prisma.permission.findUnique({ where: { name: 'all.permissions' } });
  const createPayments = await prisma.permission.findUnique({ where: { name: 'create.payments' } });

  if (adminRole && allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: allPermissions.id, isActive: true },
    });
  }

  if (collectorRole && createPayments) {
    await prisma.rolePermission.create({
      data: { roleId: collectorRole.id, permissionId: createPayments.id, isActive: true },
    });
  }

  // --------------------------
  // 3️⃣ Seed Users
  // --------------------------
  const hashedAdmin = await bcrypt.hash('password123', 10);
  const hashedCollector = await bcrypt.hash('password123', 10);
  const hashedCustomer = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Admin User', email: 'admin@example.com', password: hashedAdmin, roleId: adminRole?.id },
      { name: 'Collector User', email: 'collector@example.com', password: hashedCollector, roleId: collectorRole?.id },
      { name: 'Customer User', email: 'customer@example.com', password: hashedCustomer, roleId: collectorRole?.id },
    ],
  });

  // --------------------------
  // 4️⃣ Seed Collectors
  // --------------------------
  const zoneNorte = await prisma.zone.findUnique({ where: { code: 'NRT' } });
  const typeCC = await prisma.typeDocumentIdentification.findUnique({ where: { code: 'CC' } });
  const genderM = await prisma.gender.findUnique({ where: { code: 'M' } });
  const genderF = await prisma.gender.findUnique({ where: { code: 'F' } });

  await prisma.collector.createMany({
    data: [
      {
        firstName: 'Carlos',
        lastName: 'Ramírez',
        documentNumber: 123456789,
        birthDate: new Date('1985-01-15'),
        phone: '3001112222',
        address: 'Calle 1 #2-3',
        typeDocumentIdentificationId: typeCC!.id,
        genderId: genderM!.id,
        zoneId: zoneNorte!.id,
      },
      {
        firstName: 'Ana',
        lastName: 'Lopez',
        documentNumber: 987654321,
        birthDate: new Date('1990-06-10'),
        phone: '3003334444',
        address: 'Carrera 10 #20-30',
        typeDocumentIdentificationId: typeCC!.id,
        genderId: genderF!.id,
        zoneId: zoneNorte!.id,
      },
    ],
  });

  // --------------------------
  // 5️⃣ Seed Customers
  // --------------------------
  const zoneCentro = await prisma.zone.findUnique({ where: { code: 'CTR' } });

  await prisma.customer.createMany({
    data: [
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        documentNumber: 111222333,
        birthDate: new Date('1990-05-15'),
        phone: '3005556666',
        address: 'Calle 100 #50-60',
        typeDocumentIdentificationId: typeCC!.id,
        genderId: genderM!.id,
        zoneId: zoneCentro!.id,
      },
      {
        firstName: 'María',
        lastName: 'Gómez',
        documentNumber: 444555666,
        birthDate: new Date('1992-09-21'),
        phone: '3007778888',
        address: 'Carrera 50 #100-110',
        typeDocumentIdentificationId: typeCC!.id,
        genderId: genderF!.id,
        zoneId: zoneCentro!.id,
      },
    ],
  });

  const collectorUser = await prisma.user.findUnique({ where: { email: 'collector@example.com' } });
  const customerUser = await prisma.user.findUnique({ where: { email: 'customer@example.com' } });

  // Obtener collectors y customers creados
  const collectors = await prisma.collector.findMany({ orderBy: { id: 'asc' } });
  const customers = await prisma.customer.findMany({ orderBy: { id: 'asc' } });

  // Asociar users a collectors
  if (collectorUser && collectors[0]) {
    await prisma.collector.update({
      where: { id: collectors[0].id },
      data: { userId: collectorUser.id },
    });
  }

  // Asociar users a customers
  if (customerUser && customers[0]) {
    await prisma.customer.update({
      where: { id: customers[0].id },
      data: { userId: customerUser.id },
    });
  }
  console.log('✅ Seed completo ejecutado!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
