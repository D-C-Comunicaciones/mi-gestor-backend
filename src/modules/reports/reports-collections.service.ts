import { Injectable, Logger } from '@nestjs/common';
import { DateRangeDto } from '@common/dto';
import { PrismaService } from '@infraestructure/prisma/prisma.service';

@Injectable()
export class ReportsCollectionsService {
    private readonly logger = new Logger(ReportsCollectionsService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Obtiene todos los datos necesarios para el reporte de recaudos por cobrador
     * Basado en la consulta SQL proporcionada con JOIN de todas las tablas relacionadas
     */
    async getCollectionsReportData(dto: DateRangeDto): Promise<any> {
        this.logger.log('Consultando datos para reporte de recaudos por cobrador');

        let { startDate, endDate } = dto;

        // Configurar fechas por defecto si no se proporcionan (últimos 30 días)
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0]; // Solo fecha YYYY-MM-DD
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0]; // Solo fecha YYYY-MM-DD
        }

        try {
            // 1. Consulta principal: Pagos realizados en el período con todas las relaciones
            const rawPaymentsData = await this.prisma.$queryRaw`
                SELECT
                    p.*,
                    pa."installmentId",
                    co."firstName" || ' ' || co."lastName" as "collectorName",
                    co.id as "collectorId",
                    co."documentNumber" as "collectorDocument", 
                    co.phone as "collectorPhone",
                    cr.name as "collectorRoute",
                    cr.id as "collectorRouteId",
                    p.id as "paymentId",
                    p.amount,
                    p."loanId",
                    p."paymentDate",
                    c.id as "customerId",
                    c."firstName" || ' ' || c."lastName" as "customerName",
                    c."documentNumber" as "customerDocument",
                    zcl.id as "zoneCustomerId",
                    zcl.name as "zoneCustomerName", 
                    zcl.code as "zoneCustomerCode",
                    cr_customer.name as "customerRoute",
                    i."dueDate",
                    i."isPaid",
                    i."totalAmount",
                    i."paidAmount",
                    i."paidAt",
                    i."statusId",
                    i.sequence as "installmentSequence"
                FROM payments p
                JOIN payment_allocations pa ON pa."paymentId" = p.id
                JOIN users uc ON uc.id = p."recordedByUserId"
                JOIN collectors co ON co."userId" = uc.id
                LEFT JOIN collection_routes cr ON cr."collectorId" = co.id AND cr."isActive" = true
                JOIN installments i ON i.id = pa."installmentId"
                JOIN loans l ON l.id = p."loanId"
                JOIN customers c ON l."customerId" = c.id
                LEFT JOIN zones zcl ON zcl.id = c."zoneId"
                LEFT JOIN collection_routes cr_customer ON cr_customer.id = c."collectionRouteId"
                WHERE p."paymentDate" >= ${startDate}::date
                  AND p."paymentDate" <= ${endDate}::date
                ORDER BY p."paymentDate" ASC
            `;

            const rawPaymentsArray = rawPaymentsData as any[];
            
            // Si no hay pagos, retornar estructura vacía
            if (rawPaymentsArray.length === 0) {
                this.logger.log(`No se encontraron pagos en el período del ${startDate} al ${endDate}`);
                return {
                    startDate,
                    endDate,
                    summary: {
                        totalCollections: 0,
                        totalAssigned: 0,
                        totalCollected: 0,
                        totalPending: 0,
                        globalPerformancePercentage: 0,
                        activeCollectors: 0,
                        uniqueCustomers: 0,
                        uniqueLoans: 0,
                        totalInstallmentsInPeriod: 0,
                        totalInstallmentsPaid: 0,
                        totalInstallmentsPending: 0,
                        averageCollectedPerCollector: 0,
                        averageCollectionAmount: 0,
                        bestPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, route: 'N/A', totalCollectionsMade: 0 },
                        worstPerformanceCollector: { name: 'N/A', percentage: 0, collected: 0, assigned: 0, route: 'N/A', totalCollectionsMade: 0 },
                        mostActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                        leastActiveCollector: { name: 'N/A', totalCollectionsMade: 0, collected: 0, percentage: 0, route: 'N/A' },
                        bestCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                        worstCollector: { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },
                        chartData: {
                            collectorPerformance: [],
                            collectorComparison: [],
                            collectorActivity: [],
                            globalStats: { assigned: 0, collected: 0, pending: 0, percentage: 0 }
                        }
                    },
                    collectorSummary: [],
                    collections: [],
                    metadata: {
                        totalRecords: 0,
                        generatedAt: new Date().toISOString().split('T')[0],
                        period: `${startDate} al ${endDate}`,
                        totalCollectors: 0,
                        activeCollectors: 0
                    }
                };
            }

            this.logger.log(`Pagos encontrados: ${rawPaymentsArray.length}`);

            // 2. Consulta para obtener todas las cuotas que debían ser cobradas en el período por ruta de cobro
            const allInstallmentsData = await this.prisma.$queryRaw`
                SELECT 
                    i.id as "installmentId",
                    i."loanId",
                    i."dueDate",
                    i."totalAmount",
                    i."paidAmount",
                    i."isPaid",
                    i."statusId",
                    i.sequence,
                    co.id as "collectorId",
                    co."firstName" || ' ' || co."lastName" as "collectorName",
                    cr.name as "collectorRoute",
                    cr.id as "collectorRouteId",
                    cr_customer.name as "customerRoute",
                    c.id as "customerId",
                    c."firstName" || ' ' || c."lastName" as "customerName",
                    l.id as "loanId"
                FROM installments i
                JOIN loans l ON l.id = i."loanId"
                JOIN customers c ON c.id = l."customerId"
                LEFT JOIN zones zcl ON zcl.id = c."zoneId"
                LEFT JOIN collection_routes cr_customer ON cr_customer.id = c."collectionRouteId"
                LEFT JOIN collectors co ON co.id = cr_customer."collectorId" AND co."isActive" = true
                LEFT JOIN collection_routes cr ON cr."collectorId" = co.id AND cr."isActive" = true
                WHERE i."dueDate" >= ${startDate}::date
                  AND i."dueDate" <= ${endDate}::date
                  AND l."isActive" = true
                  AND c."isActive" = true
                ORDER BY i."dueDate" ASC
            `;

            const allInstallmentsArray = allInstallmentsData as any[];
            this.logger.log(`Cuotas en período: ${allInstallmentsArray.length}`);

            // 3. Procesar pagos realizados con información de ruta específica
            const collections = rawPaymentsArray.map((record: any) => ({
                paymentId: Number(record.paymentId),
                paymentDate: record.paymentDate instanceof Date 
                    ? record.paymentDate.toISOString().split('T')[0] 
                    : record.paymentDate,
                amount: parseFloat(record.amount.toString()),
                paymentTypeId: Number(record.paymentTypeId),
                paymentMethodId: Number(record.paymentMethodId),
                recordedByUserId: Number(record.recordedByUserId),
                installmentId: Number(record.installmentId),
                collectorName: record.collectorName || 'Sin cobrador',
                collectorId: Number(record.collectorId),
                collectorDocument: record.collectorDocument?.toString() || '',
                collectorPhone: record.collectorPhone || '',
                collectorRoute: record.collectorRoute || 'Sin ruta asignada', // 🎯 Ahora es la ruta específica
                collectorRouteId: record.collectorRouteId ? Number(record.collectorRouteId) : null,
                customerRoute: record.customerRoute || 'Sin ruta asignada',
                loanId: Number(record.loanId),
                customerId: Number(record.customerId),
                customerName: record.customerName || 'Sin nombre',
                customerDocument: record.customerDocument?.toString() || '',
                zoneCustomerId: record.zoneCustomerId ? Number(record.zoneCustomerId) : null,
                zoneCustomerName: record.zoneCustomerName || 'Sin zona',
                zoneCustomerCode: record.zoneCustomerCode || 'N/A',
                installmentDueDate: record.dueDate ? 
                    (record.dueDate instanceof Date ? record.dueDate.toISOString().split('T')[0] : record.dueDate) 
                    : null,
                installmentIsPaid: Boolean(record.isPaid),
                installmentTotalAmount: parseFloat(record.totalAmount.toString()),
                installmentPaidAmount: parseFloat(record.paidAmount?.toString() || '0'),
                installmentPaidAt: record.paidAt ? 
                    (record.paidAt instanceof Date ? record.paidAt.toISOString() : record.paidAt)
                    : null,
                installmentStatusId: record.statusId ? Number(record.statusId) : null,
                installmentSequence: record.installmentSequence ? Number(record.installmentSequence) : null
            }));

            // 4. Calcular asignaciones y recaudos por cobrador y ruta individual
            const collectorRouteMap = new Map(); // 🎯 Cambio: mapa por cobrador + ruta
            const globalMetrics = {
                totalAssignedAmount: 0,
                totalCollectedAmount: 0,
                totalInstallmentsAssigned: 0,
                totalInstallmentsPaid: 0
            };

            // Procesar todas las cuotas asignadas por cobrador + ruta específica
            allInstallmentsArray.forEach(installment => {
                if (!installment.collectorId) return; // Skip si no hay cobrador asignado

                // 🎯 Si no tiene ruta específica, crear una entrada por defecto
                const routeId = installment.collectorRouteId || 'sin_ruta';
                const routeName = installment.collectorRoute || 'Sin Ruta Asignada';
                
                // 🎯 Crear clave única por cobrador + ruta
                const collectorRouteKey = `${installment.collectorId}_${routeId}`;
                const totalAmount = parseFloat(installment.totalAmount.toString());
                const paidAmount = parseFloat(installment.paidAmount?.toString() || '0');
                
                globalMetrics.totalAssignedAmount += totalAmount;
                globalMetrics.totalInstallmentsAssigned += 1;
                
                if (installment.isPaid) {
                    globalMetrics.totalInstallmentsPaid += 1;
                }
                globalMetrics.totalCollectedAmount += paidAmount;

                if (!collectorRouteMap.has(collectorRouteKey)) {
                    collectorRouteMap.set(collectorRouteKey, {
                        collectorId: installment.collectorId,
                        collectorName: installment.collectorName || 'Sin nombre',
                        collectorRoute: routeName, // 🎯 Nombre de ruta específica o "Sin Ruta Asignada"
                        collectorRouteId: routeId,
                        totalAssigned: 0,
                        totalCollected: 0,
                        installmentsAssigned: 0,
                        installmentsPaid: 0,
                        paymentsRegistered: 0,
                        uniqueCustomers: new Set(),
                        uniqueLoans: new Set(),
                        totalCollectionsMade: 0
                    });
                }

                const collectorRoute = collectorRouteMap.get(collectorRouteKey);
                collectorRoute.totalAssigned += totalAmount;
                collectorRoute.installmentsAssigned += 1;
                collectorRoute.totalCollected += paidAmount;
                
                if (installment.isPaid) {
                    collectorRoute.installmentsPaid += 1;
                }
                
                collectorRoute.uniqueCustomers.add(installment.customerId);
                collectorRoute.uniqueLoans.add(installment.loanId);
            });

            // Agregar pagos registrados por cada cobrador+ruta y contar cobros realizados
            collections.forEach(collection => {
                const routeId = collection.collectorRouteId || 'sin_ruta';
                const collectorRouteKey = `${collection.collectorId}_${routeId}`;
                
                if (collectorRouteMap.has(collectorRouteKey)) {
                    const collectorRoute = collectorRouteMap.get(collectorRouteKey);
                    collectorRoute.paymentsRegistered += 1;
                    collectorRoute.totalCollectionsMade += 1;
                }
            });

            // 6. Convertir el Map a Array y calcular métricas finales por ruta individual
            const collectorSummary = Array.from(collectorRouteMap.values()).map(collectorRoute => {
                const performancePercentage = collectorRoute.totalAssigned > 0 
                    ? (collectorRoute.totalCollected / collectorRoute.totalAssigned) * 100 
                    : 0;
                
                const collectionEfficiency = collectorRoute.installmentsAssigned > 0
                    ? (collectorRoute.installmentsPaid / collectorRoute.installmentsAssigned) * 100
                    : 0;

                return {
                    collectorId: collectorRoute.collectorId,
                    collectorName: collectorRoute.collectorName,
                    collectorRoute: collectorRoute.collectorRoute, // 🎯 Ruta específica o "Sin Ruta Asignada"
                    collectorRouteId: collectorRoute.collectorRouteId,
                    totalAssigned: Math.round(collectorRoute.totalAssigned * 100) / 100,
                    totalCollected: Math.round(collectorRoute.totalCollected * 100) / 100,
                    totalPending: Math.round((collectorRoute.totalAssigned - collectorRoute.totalCollected) * 100) / 100,
                    performancePercentage: Math.round(performancePercentage * 100) / 100,
                    collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
                    installmentsAssigned: collectorRoute.installmentsAssigned,
                    installmentsPaid: collectorRoute.installmentsPaid,
                    installmentsPending: collectorRoute.installmentsAssigned - collectorRoute.installmentsPaid,
                    paymentsRegistered: collectorRoute.paymentsRegistered,
                    totalCollectionsMade: collectorRoute.totalCollectionsMade,
                    uniqueCustomers: collectorRoute.uniqueCustomers.size,
                    uniqueLoans: collectorRoute.uniqueLoans.size,
                    averageCollectionAmount: collectorRoute.paymentsRegistered > 0 
                        ? Math.round((collectorRoute.totalCollected / collectorRoute.paymentsRegistered) * 100) / 100 
                        : 0
                };
            }).sort((a, b) => b.totalCollected - a.totalCollected);

            // 7. Calcular métricas globales y destacar mejor/peor cobrador por rendimiento
            const globalPerformancePercentage = globalMetrics.totalAssignedAmount > 0
                ? (globalMetrics.totalCollectedAmount / globalMetrics.totalAssignedAmount) * 100
                : 0;

            // Ordenar cobradores por rendimiento para destacar mejor y peor
            const collectorsByPerformance = [...collectorSummary]
                .filter(c => c.performancePercentage > 0)
                .sort((a, b) => b.performancePercentage - a.performancePercentage);

            // Ordenar cobradores por número de cobros realizados
            const collectorsByCollections = [...collectorSummary]
                .sort((a, b) => b.totalCollectionsMade - a.totalCollectionsMade);

            // Mejor y peor cobrador por rendimiento
            const bestPerformanceCollector = collectorsByPerformance[0] || null;
            const worstPerformanceCollector = collectorsByPerformance[collectorsByPerformance.length - 1] || null;

            // Mejor y peor cobrador por cantidad de cobros
            const mostActiveCollector = collectorsByCollections[0] || null;
            const leastActiveCollector = collectorsByCollections[collectorsByCollections.length - 1] || null;

            const summary = {
                totalCollections: collections.length,
                totalAssigned: Math.round(globalMetrics.totalAssignedAmount * 100) / 100,
                totalCollected: Math.round(globalMetrics.totalCollectedAmount * 100) / 100,
                totalPending: Math.round((globalMetrics.totalAssignedAmount - globalMetrics.totalCollectedAmount) * 100) / 100,
                globalPerformancePercentage: Math.round(globalPerformancePercentage * 100) / 100,
                activeCollectors: collectorSummary.length,
                uniqueCustomers: new Set(allInstallmentsArray.map(i => i.customerId)).size,
                uniqueLoans: new Set(allInstallmentsArray.map(i => i.loanId)).size,
                totalInstallmentsInPeriod: globalMetrics.totalInstallmentsAssigned,
                totalInstallmentsPaid: globalMetrics.totalInstallmentsPaid,
                totalInstallmentsPending: globalMetrics.totalInstallmentsAssigned - globalMetrics.totalInstallmentsPaid,
                averageCollectedPerCollector: collectorSummary.length > 0 
                    ? Math.round((globalMetrics.totalCollectedAmount / collectorSummary.length) * 100) / 100 
                    : 0,
                averageCollectionAmount: collections.length > 0 
                    ? Math.round((globalMetrics.totalCollectedAmount / collections.length) * 100) / 100 
                    : 0,
                
                // DESTACADOS POR RENDIMIENTO
                bestPerformanceCollector: bestPerformanceCollector ? {
                    name: bestPerformanceCollector.collectorName,
                    percentage: bestPerformanceCollector.performancePercentage,
                    collected: bestPerformanceCollector.totalCollected,
                    assigned: bestPerformanceCollector.totalAssigned,
                    route: bestPerformanceCollector.collectorRoute, // 🎯 Ruta específica
                    totalCollectionsMade: bestPerformanceCollector.totalCollectionsMade
                } : { 
                    name: 'N/A', 
                    percentage: 0, 
                    collected: 0, 
                    assigned: 0, 
                    route: 'N/A', 
                    totalCollectionsMade: 0 
                },

                worstPerformanceCollector: worstPerformanceCollector ? {
                    name: worstPerformanceCollector.collectorName,
                    percentage: worstPerformanceCollector.performancePercentage,
                    collected: worstPerformanceCollector.totalCollected,
                    assigned: worstPerformanceCollector.totalAssigned,
                    route: worstPerformanceCollector.collectorRoute, // 🎯 Ruta específica
                    totalCollectionsMade: worstPerformanceCollector.totalCollectionsMade
                } : { 
                    name: 'N/A', 
                    percentage: 0, 
                    collected: 0, 
                    assigned: 0, 
                    route: 'N/A', 
                    totalCollectionsMade: 0 
                },

                // DESTACADOS POR ACTIVIDAD DE COBROS
                mostActiveCollector: mostActiveCollector ? {
                    name: mostActiveCollector.collectorName,
                    totalCollectionsMade: mostActiveCollector.totalCollectionsMade,
                    collected: mostActiveCollector.totalCollected,
                    percentage: mostActiveCollector.performancePercentage,
                    route: mostActiveCollector.collectorRoute // 🎯 Ruta específica
                } : { 
                    name: 'N/A', 
                    totalCollectionsMade: 0, 
                    collected: 0, 
                    percentage: 0, 
                    route: 'N/A' 
                },

                leastActiveCollector: leastActiveCollector ? {
                    name: leastActiveCollector.collectorName,
                    totalCollectionsMade: leastActiveCollector.totalCollectionsMade,
                    collected: leastActiveCollector.totalCollected,
                    percentage: leastActiveCollector.performancePercentage,
                    route: leastActiveCollector.collectorRoute // 🎯 Ruta específica
                } : { 
                    name: 'N/A', 
                    totalCollectionsMade: 0, 
                    collected: 0, 
                    percentage: 0, 
                    route: 'N/A' 
                },

                // MANTENER COMPATIBILIDAD CON CÓDIGO EXISTENTE
                bestCollector: bestPerformanceCollector ? {
                    name: bestPerformanceCollector.collectorName,
                    percentage: bestPerformanceCollector.performancePercentage,
                    collected: bestPerformanceCollector.totalCollected,
                    route: bestPerformanceCollector.collectorRoute // 🎯 Ruta específica
                } : { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },

                worstCollector: worstPerformanceCollector ? {
                    name: worstPerformanceCollector.collectorName,
                    percentage: worstPerformanceCollector.performancePercentage,
                    collected: worstPerformanceCollector.totalCollected,
                    route: worstPerformanceCollector.collectorRoute // 🎯 Ruta específica
                } : { name: 'N/A', percentage: 0, collected: 0, route: 'N/A' },

                // Datos para gráficas (actualizado con rutas específicas)
                chartData: {
                    collectorPerformance: collectorSummary.map(c => ({
                        collectorName: c.collectorName,
                        percentage: c.performancePercentage,
                        collected: c.totalCollected,
                        assigned: c.totalAssigned,
                        route: c.collectorRoute, // 🎯 Ruta específica
                        totalCollectionsMade: c.totalCollectionsMade
                    })),
                    collectorComparison: collectorSummary.map(c => ({
                        name: `${c.collectorName.split(' ')[0]} (${c.collectorRoute})`, // 🎯 Incluir ruta en el nombre
                        collected: c.totalCollected,
                        assigned: c.totalAssigned,
                        pending: c.totalPending,
                        percentage: c.performancePercentage,
                        totalCollectionsMade: c.totalCollectionsMade
                    })),
                    collectorActivity: collectorsByCollections.map(c => ({
                        name: `${c.collectorName.split(' ')[0]} (${c.collectorRoute})`, // 🎯 Incluir ruta en el nombre
                        totalCollectionsMade: c.totalCollectionsMade,
                        collected: c.totalCollected,
                        percentage: c.performancePercentage
                    })),
                    globalStats: {
                        assigned: globalMetrics.totalAssignedAmount,
                        collected: globalMetrics.totalCollectedAmount,
                        pending: globalMetrics.totalAssignedAmount - globalMetrics.totalCollectedAmount,
                        percentage: globalPerformancePercentage
                    }
                }
            };

            // Log para debugging mejorado
            this.logger.log(`\n🔍 DEBUGGING DETALLADO:`);
            this.logger.log(`Total de asignaciones cobrador+ruta: ${collectorSummary.length}`);
            this.logger.log(`\nDETALLE POR COBRADOR Y RUTA:`);
            collectorSummary.forEach((c, index) => {
                this.logger.log(`${index + 1}. Cobrador: "${c.collectorName}" | Ruta: "${c.collectorRoute}" | Rendimiento: ${c.performancePercentage}% | Recaudado: $${c.totalCollected} | Asignado: $${c.totalAssigned} | Cobros: ${c.totalCollectionsMade}`);
            });

            // 7. Preparar respuesta final
            const reportData = {
                startDate,
                endDate,
                summary,
                collectorSummary,
                collections: collections.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()),
                metadata: {
                    totalRecords: collections.length,
                    generatedAt: new Date().toISOString().split('T')[0],
                    period: `${startDate} al ${endDate}`,
                    totalCollectors: new Set(collectorSummary.map(c => c.collectorId)).size, // 🎯 Contar cobradores únicos
                    totalRouteAssignments: collectorSummary.length, // 🎯 Total de asignaciones cobrador+ruta
                    activeCollectors: collectorSummary.filter(c => c.paymentsRegistered > 0).length
                }
            };

            this.logger.log(`Reporte consultado exitosamente: ${collections.length} recaudos de ${new Set(collectorSummary.map(c => c.collectorId)).size} cobradores en ${collectorSummary.length} asignaciones de ruta`);
            
            return reportData;

        } catch (error) {
            this.logger.error(`Error al consultar datos del reporte: ${error.message}`);
            throw error;
        }
    }

}