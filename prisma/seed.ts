import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // -------- LoanStatus --------
  const loanStatuses = [
    { name: 'Up to Date', description: 'El préstamo está al día con los pagos.' },
    { name: 'Overdue', description: 'El préstamo está en mora.' },
    { name: 'Paid', description: 'El préstamo ha sido pagado en su totalidad.' },
    { name: 'Cancelled', description: 'El préstamo ha sido cancelado.' },
    { name: 'Refinanced', description: 'El préstamo ha sido refinanciado.' },
    { name: 'Outstanding Balance', description: 'El préstamo tiene un saldo pendiente.' }
  ]
  await prisma.loanStatus.createMany({ data: loanStatuses, skipDuplicates: true })

  // -------- PaymentFrequency --------
  const paymentFrequencies = ['Daily', 'Weekly', 'Biweekly', 'Monthly'].map(name => ({ name }))
  await prisma.paymentFrequency.createMany({ data: paymentFrequencies, skipDuplicates: true })

  // -------- TypeDocumentIdentification --------
  const docTypes = [
    { name: 'Cédula de Ciudadanía', code: 'CC' },
    { name: 'Cédula de Extranjería', code: 'CE' },
    { name: 'Pasaporte', code: 'PP' },
    { name: 'Permiso Especial de Permanencia', code: 'PEP' },
    { name: 'Permiso de Protección Temporal', code: 'PPT' }
  ]
  await prisma.typeDocumentIdentification.createMany({ data: docTypes, skipDuplicates: true })

  // -------- Gender --------
  const genders = [
    { name: 'Masculino', code: 'M' },
    { name: 'Femenino', code: 'F' }
  ]
  await prisma.gender.createMany({ data: genders, skipDuplicates: true })

  // -------- LoanType --------
  const loanTypes = [
    { name: 'fixed_fees' },
    { name: 'only_interests' }
  ]
  await prisma.loanType.createMany({ data: loanTypes, skipDuplicates: true })

  // -------- PaymentType --------
  const paymentTypes = [
    { name: 'Pago de Cuota' },
    { name: 'Abono a Cuota' }
  ]
  await prisma.paymentType.createMany({ data: paymentTypes, skipDuplicates: true })

  // -------- Role --------
  const roles = await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'collector', description: 'Cobrador' }
    ],
    skipDuplicates: true
  })

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  const collectorRole = await prisma.role.findUnique({ where: { name: 'collector' } })

  // -------- Permission --------
  const permissions = await prisma.permission.createMany({
    data: [
      { name: 'all.permissions', description: 'Super Usuario del Sistema' },
      { name: 'create.collections', description: 'Registrar (Recaudos)' },
      { name: 'view.customers', description: 'Ver clientes' }
    ],
    skipDuplicates: true
  })

  const allPermissions = await prisma.permission.findUnique({ where: { name: 'all.permissions' } })
  const createCollections = await prisma.permission.findUnique({ where: { name: 'create.collections' } })
  const viewCustomers = await prisma.permission.findUnique({ where: { name: 'view.customers' } })

  if (adminRole && allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: allPermissions.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: allPermissions.id }
    })
  }

  if (collectorRole && createCollections && viewCustomers) {
    await prisma.rolePermission.createMany({
      data: [
        { roleId: collectorRole.id, permissionId: createCollections.id },
        { roleId: collectorRole.id, permissionId: viewCustomers.id }
      ],
      skipDuplicates: true
    })
  }

  // -------- InterestRate (1% a 100%) --------
  const interestRates = Array.from({ length: 100 }, (_, i) => ({
    name: `${i + 1}%`,
    value: (i + 1)
  }))
  await prisma.interestRate.createMany({ data: interestRates, skipDuplicates: true })

  // -------- Term (1 a 100) --------
  const terms = Array.from({ length: 100 }, (_, i) => ({ value: i + 1 }))
  await prisma.term.createMany({ data: terms, skipDuplicates: true })

  // -------- PenaltyRate --------
  const penaltyRates = [
    { name: 'Interés moratorio legal máximo mensual', value: 2.0 },
    { name: 'Interés moratorio promedio usado por prestamistas informales', value: 5.0 },
    { name: 'Interés moratorio alto (gota a gota)', value: 10.0 }
  ]
  await prisma.penaltyRate.createMany({ data: penaltyRates, skipDuplicates: true })

  // -------- MoratoryInterestStatus --------
  const moratoryStatuses = [
    'Discounted',
    'Partially Discounted',
    'Paid',
    'Unpaid',
    'Partially Paid'
  ].map(name => ({ name }))
  await prisma.moratoryInterestStatus.createMany({ data: moratoryStatuses, skipDuplicates: true })

  // -------- GracePeriod --------
  const gracePeriods = [
    { name: '15 días', days: 15 },
    ...Array.from({ length: 12 }, (_, i) => ({
      name: `${i + 1} mes${i > 0 ? 'es' : ''}`,
      days: 30 * (i + 1)
    }))
  ]
  await prisma.gracePeriod.createMany({ data: gracePeriods, skipDuplicates: true })

  // -------- InstallmentStatus --------
  const installmentStatuses = [
    { name: 'Pending', description: 'Saldo en Cuota pendiente' },
    { name: 'Paid', description: 'Saldo en Cuota pagada' },
    { name: 'Overdue Paid', description: 'Pago de intereses moratorios' },
    { name: 'Created', description: 'Cuota generada' },
    { name: 'Unpaid', description: 'Cuota no pagada' }
  ]
  await prisma.installmentStatus.createMany({ data: installmentStatuses, skipDuplicates: true })

  // -------- PaymentMethod --------
  const paymentMethods = [
    'Efectivo',
    'Transferencia Bancaria',
    'Tarjeta de Crédito',
    'Tarjeta Débito',
    'Cheque',
    'Otro'
  ].map(name => ({ name }))
  await prisma.paymentMethod.createMany({ data: paymentMethods, skipDuplicates: true })

  // -------- DiscountType --------
  await prisma.discountType.createMany({
    data: [{ name: 'Moratorios', description: 'Descuento de intereses moratorios' }],
    skipDuplicates: true
  })

  // -------- Timezone --------
  const timezones = [
    { name: 'America/Bogota', offset: '-05:00' },
    { name: 'America/Mexico_City', offset: '-06:00' },
    { name: 'America/Lima', offset: '-05:00' },
    { name: 'America/Caracas', offset: '-04:00' },
    { name: 'America/Santiago', offset: '-03:00' },
    { name: 'America/New_York', offset: '-04:00' },
    { name: 'Europe/Madrid', offset: '+02:00' }
  ]
  await prisma.timezone.createMany({ data: timezones, skipDuplicates: true })

  // -------- Usuario admin --------
  if (adminRole) {
    const passwordHash = await bcrypt.hash('Pigkek-5cizre-vughig', 10)
    await prisma.user.upsert({
      where: { email: 'admin@dcmigestor.co' },
      update: {},
      create: {
        email: 'admin@dcmigestor.co',
        password: passwordHash,
        name: 'Administrador del sistema',
        roleId: adminRole.id
      }
    })
  }

  await prisma.importHistoryStatus.createMany({
    data: [
      { name: 'Pending', description: 'La importación está pendiente' },
      { name: 'In Progress', description: 'La importación está en progreso' },
      { name: 'Completed', description: 'La importación se completó con éxito' },
      { name: 'Failed', description: 'La importación falló' },
      { name: 'Incomplete', description: 'La importación fue incompleta' },
    ],
    skipDuplicates: true,
  });

  await prisma.currency.createMany({
    data: [
      { code: 'COP', name: 'Peso colombiano', symbol: '$', isActive: true },
      { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', isActive: true },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed completado exitosamente.')
}

main()
  .catch(e => {
    console.error('❌ Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
