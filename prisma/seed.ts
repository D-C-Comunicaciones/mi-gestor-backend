import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// 🔍 Verifica si una tabla está vacía
async function tableIsEmpty(model: any) {
  const count = await model.count()
  return count === 0
}

// 🧩 Obtiene o crea el registro en SeedStatus
async function getOrCreateSeedStatus(model: string) {
  const existing = await prisma.seedStatus.findUnique({ where: { model } })
  if (!existing) {
    return await prisma.seedStatus.create({ data: { model, seeded: false } })
  }
  return existing
}

// ✅ Marca el seed como ejecutado
async function markSeedAsExecuted(model: string) {
  await prisma.seedStatus.upsert({
    where: { model },
    update: { seeded: true },
    create: { model, seeded: true },
  })
}

// ⚙️ Lógica para decidir si correr el seed
async function shouldRunSeed(model: any, modelName: string) {
  const seedStatus = await getOrCreateSeedStatus(modelName)
  const isEmpty = await tableIsEmpty(model)

  if (!isEmpty && !seedStatus.seeded) {
    console.log(`⚠️  ${modelName}: tiene datos pero estaba en false → marcando como true.`)
    await markSeedAsExecuted(modelName)
    return false
  }

  if (!isEmpty && seedStatus.seeded) {
    console.log(`⏩  ${modelName}: tiene datos y ya fue ejecutado → ignorando.`)
    return false
  }

  if (isEmpty) {
    console.log(`🌱  ${modelName}: tabla vacía → ejecutando seed.`)
    return true
  }

  return false
}

async function main() {
  console.log('🔍 Verificando condiciones de seed...')

  // -------- LoanStatus --------
  if (await shouldRunSeed(prisma.loanStatus, 'LoanStatus')) {
    await prisma.loanStatus.createMany({
      data: [
        { name: 'Up to Date', description: 'El préstamo está al día con los pagos.' },
        { name: 'Overdue', description: 'El préstamo está en mora.' },
        { name: 'Paid', description: 'El préstamo ha sido pagado en su totalidad.' },
        { name: 'Cancelled', description: 'El préstamo ha sido cancelado.' },
        { name: 'Refinanced', description: 'El préstamo ha sido refinanciado.' },
        { name: 'Outstanding Balance', description: 'El préstamo tiene un saldo pendiente.' },
      ],
    })
    await markSeedAsExecuted('LoanStatus')
  }

  // -------- PaymentFrequency --------
  if (await shouldRunSeed(prisma.paymentFrequency, 'PaymentFrequency')) {
    const data = ['Daily', 'Weekly', 'Biweekly', 'Monthly'].map(name => ({ name }))
    await prisma.paymentFrequency.createMany({ data })
    await markSeedAsExecuted('PaymentFrequency')
  }

  // -------- TypeDocumentIdentification --------
  if (await shouldRunSeed(prisma.typeDocumentIdentification, 'TypeDocumentIdentification')) {
    const data = [
      { name: 'Cédula de Ciudadanía', code: 'CC' },
      { name: 'Cédula de Extranjería', code: 'CE' },
      { name: 'Pasaporte', code: 'PP' },
      { name: 'Permiso Especial de Permanencia', code: 'PEP' },
      { name: 'Permiso de Protección Temporal', code: 'PPT' },
    ]
    await prisma.typeDocumentIdentification.createMany({ data })
    await markSeedAsExecuted('TypeDocumentIdentification')
  }

  // -------- Gender --------
  if (await shouldRunSeed(prisma.gender, 'Gender')) {
    const data = [
      { name: 'Masculino', code: 'M' },
      { name: 'Femenino', code: 'F' },
    ]
    await prisma.gender.createMany({ data })
    await markSeedAsExecuted('Gender')
  }

  // -------- LoanType --------
  if (await shouldRunSeed(prisma.loanType, 'LoanType')) {
    await prisma.loanType.createMany({ data: [{ name: 'fixed_fees' }, { name: 'only_interests' }] })
    await markSeedAsExecuted('LoanType')
  }

  // -------- PaymentType --------
  if (await shouldRunSeed(prisma.paymentType, 'PaymentType')) {
    const data = [{ name: 'Pago de Cuota' }, { name: 'Abono a Cuota' }]
    await prisma.paymentType.createMany({ data })
    await markSeedAsExecuted('PaymentType')
  }

  // -------- Role --------
  if (await shouldRunSeed(prisma.role, 'Role')) {
    await prisma.role.createMany({
      data: [
        { name: 'admin', description: 'Administrador del sistema' },
        { name: 'collector', description: 'Cobrador' },
      ],
    })
    await markSeedAsExecuted('Role')
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  const collectorRole = await prisma.role.findUnique({ where: { name: 'collector' } })

  // -------- Permission --------
  if (await shouldRunSeed(prisma.permission, 'Permission')) {
    await prisma.permission.createMany({
      data: [
        { name: 'all.permissions', description: 'Super Usuario del Sistema' },
        { name: 'create.collections', description: 'Registrar (Recaudos)' },
        { name: 'view.customers', description: 'Ver clientes' },
        { name: 'view.loans', description: 'Ver préstamos' },
        { name: 'view.dashboard', description: 'Ver panel de control' },
      ],
    })
    await markSeedAsExecuted('Permission')
  }

  const allPermissions = await prisma.permission.findUnique({ where: { name: 'all.permissions' } })
  const createCollections = await prisma.permission.findUnique({ where: { name: 'create.collections' } })
  const viewCustomers = await prisma.permission.findUnique({ where: { name: 'view.customers' } })
  const viewLoans = await prisma.permission.findUnique({ where: { name: 'view.loans' } })
  const viewDashboard = await prisma.permission.findUnique({ where: { name: 'view.dashboard' } })

  // -------- RolePermission --------

  if (adminRole && allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: allPermissions.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: allPermissions.id },
    })
  }

  if (collectorRole && createCollections && viewCustomers) {
    await prisma.rolePermission.createMany({
      data: [
        { roleId: collectorRole.id, permissionId: createCollections.id },
        { roleId: collectorRole.id, permissionId: viewCustomers.id },
        { roleId: collectorRole.id, permissionId: viewLoans.id },
        { roleId: collectorRole.id, permissionId: viewDashboard.id },
      ],
      skipDuplicates: true,
    })
  }

  // -------- InterestRate --------
  if (await shouldRunSeed(prisma.interestRate, 'InterestRate')) {
    const data = Array.from({ length: 100 }, (_, i) => ({
      name: `${i + 1}%`,
      value: i + 1,
    }))
    await prisma.interestRate.createMany({ data })
    await markSeedAsExecuted('InterestRate')
  }

  // -------- Term --------
  if (await shouldRunSeed(prisma.term, 'Term')) {
    const data = Array.from({ length: 100 }, (_, i) => ({ value: i + 1 }))
    await prisma.term.createMany({ data })
    await markSeedAsExecuted('Term')
  }

  // -------- PenaltyRate --------
  if (await shouldRunSeed(prisma.penaltyRate, 'PenaltyRate')) {
    const data = [
      { name: 'Interés moratorio legal máximo mensual', value: 2.0 },
      { name: 'Interés moratorio promedio usado por prestamistas informales', value: 5.0 },
      { name: 'Interés moratorio alto (gota a gota)', value: 10.0 },
    ]
    await prisma.penaltyRate.createMany({ data })
    await markSeedAsExecuted('PenaltyRate')
  }

  // -------- MoratoryInterestStatus --------
  if (await shouldRunSeed(prisma.moratoryInterestStatus, 'MoratoryInterestStatus')) {
    const data = [
      'Discounted',
      'Partially Discounted',
      'Paid',
      'Unpaid',
      'Partially Paid',
    ].map(name => ({ name }))
    await prisma.moratoryInterestStatus.createMany({ data })
    await markSeedAsExecuted('MoratoryInterestStatus')
  }

  // -------- GracePeriod --------
  if (await shouldRunSeed(prisma.gracePeriod, 'GracePeriod')) {
    const data = [
      { name: '15 días', days: 15 },
      ...Array.from({ length: 12 }, (_, i) => ({
        name: `${i + 1} mes${i > 0 ? 'es' : ''}`,
        days: 30 * (i + 1),
      })),
    ]
    await prisma.gracePeriod.createMany({ data })
    await markSeedAsExecuted('GracePeriod')
  }

  // -------- InstallmentStatus --------
  if (await shouldRunSeed(prisma.installmentStatus, 'InstallmentStatus')) {
    const data = [
      { name: 'Pending', description: 'Saldo en Cuota pendiente' },
      { name: 'Paid', description: 'Saldo en Cuota pagada' },
      { name: 'Overdue Paid', description: 'Pago de intereses moratorios' },
      { name: 'Created', description: 'Cuota generada' },
    ]
    await prisma.installmentStatus.createMany({ data })
    await markSeedAsExecuted('InstallmentStatus')
  }

  // -------- PaymentMethod --------
  if (await shouldRunSeed(prisma.paymentMethod, 'PaymentMethod')) {
    const data = [
      'Efectivo',
      'Transferencia Bancaria',
      'Tarjeta de Crédito',
      'Tarjeta Débito',
      'Cheque',
      'Otro',
    ].map(name => ({ name }))
    await prisma.paymentMethod.createMany({ data })
    await markSeedAsExecuted('PaymentMethod')
  }

  // -------- DiscountType --------
  if (await shouldRunSeed(prisma.discountType, 'DiscountType')) {
    await prisma.discountType.createMany({
      data: [{ name: 'Moratorios', description: 'Descuento de intereses moratorios' }],
    })
    await markSeedAsExecuted('DiscountType')
  }

  // -------- Timezone --------
  if (await shouldRunSeed(prisma.timezone, 'Timezone')) {
    const data = [
      { name: 'America/Bogota', offset: '-05:00' },
      { name: 'America/Mexico_City', offset: '-06:00' },
      { name: 'America/Lima', offset: '-05:00' },
      { name: 'America/Caracas', offset: '-04:00' },
      { name: 'America/Santiago', offset: '-03:00' },
      { name: 'America/New_York', offset: '-04:00' },
      { name: 'Europe/Madrid', offset: '+02:00' },
    ]
    await prisma.timezone.createMany({ data })
    await markSeedAsExecuted('Timezone')
  }

  // -------- ImportHistoryStatus --------
  if (await shouldRunSeed(prisma.importHistoryStatus, 'ImportHistoryStatus')) {
    await prisma.importHistoryStatus.createMany({
      data: [
        { name: 'Pending', description: 'La importación está pendiente' },
        { name: 'In Progress', description: 'La importación está en progreso' },
        { name: 'Completed', description: 'La importación se completó con éxito' },
        { name: 'Failed', description: 'La importación falló' },
        { name: 'Incomplete', description: 'La importación fue incompleta' },
      ],
    })
    await markSeedAsExecuted('ImportHistoryStatus')
  }

  // -------- Currency --------
  if (await shouldRunSeed(prisma.currency, 'Currency')) {
    await prisma.currency.createMany({
      data: [
        { code: 'COP', name: 'Peso colombiano', symbol: '$', isActive: true },
        { code: 'USD', name: 'Dólar estadounidense', symbol: 'US$', isActive: true },
      ],
    })
    await markSeedAsExecuted('Currency')
  }

  // -------- Usuario admin --------
  if (adminRole && (await shouldRunSeed(prisma.user, 'User'))) {
    const passwordHash = await bcrypt.hash('Pigkek-5cizre-vughig', 10)
    await prisma.user.create({
      data: {
        email: 'admin@dcmigestor.co',
        password: passwordHash,
        name: 'Administrador del sistema',
        roleId: adminRole.id,
      },
    })
    await markSeedAsExecuted('User')
  }

  console.log('✅ Seed completado correctamente.')
}

main()
  .catch(e => {
    console.error('❌ Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
