import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const modelsToSeed = [
    'LoanStatus',
    'PaymentFrequency',
    'TypeDocumentIdentification',
    'Gender',
    'LoanType',
    'PaymentType',
    'Role',
    'Permission',
    'RolePermission',
    'InterestRate',
    'Term',
    'PenaltyRate',
    'MoratoryInterestStatus',
    'GracePeriod',
    'InstallmentStatus',
    'PaymentMethod',
    'DiscountType',
    'Timezone',
    'ImportHistoryStatus',
    'Currency',
    'User',
]

async function main() {
    console.log('🔍 Verificando tabla SeedStatus...')

    // Verificar si existe algún registro
    const existing = await prisma.seedStatus.findMany()
    if (existing.length === 0) {
        console.log('🌱 No hay registros en SeedStatus → creando...')
        await prisma.seedStatus.createMany({
            data: modelsToSeed.map(model => ({
                model,
                seeded: false,
            })),
        })
        console.log(`✅ SeedStatus inicializado con ${modelsToSeed.length} modelos.`)
    } else {
        console.log(`⏩ SeedStatus ya contiene ${existing.length} registros → no se modifica.`)
    }
}

main()
    .then(async () => {
        console.log('✅ Finalizado correctamente.')
        await prisma.$disconnect()
    })
    .catch(async e => {
        console.error('❌ Error ejecutando seed-status:', e)
        await prisma.$disconnect()
        process.exit(1)
    })