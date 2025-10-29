import { ResponseDashboardDto } from '@modules/dashboard/dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function SwaggerDashboard() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener datos del panel principal',
            description: 'Devuelve métricas consolidadas para el panel administrativo, incluyendo totales, cobros mensuales, estados de clientes, desempeño de cobradores y los pagos más recientes.',
        }),
        ApiOkResponse({
            description: 'Datos del panel obtenidos correctamente',
            type: ResponseDashboardDto,
            examples: {
                example1: {
                    summary: 'Respuesta exitosa',
                    value: {
                        cards: {
                            totalCollected: 8700000,
                            totalCustomers: 454,
                            customersInOverdue: 89,
                            installmentsInProgress: 247,
                            installmentsDueSoon: 23,
                        },
                        monthlyCollection: {
                            startDate: '2025-10-01',
                            endDate: '2025-10-31',
                            daily: [
                                { date: '2025-10-01', total: 125000 },
                                { date: '2025-10-02', total: 98000 },
                            ],
                        },
                        clientStatus: {
                            upToDate: { count: 340, percent: 75 },
                            overdue: { count: 89, percent: 20 },
                            dueSoon: { count: 25, percent: 5 },
                        },
                        collectorsPerformance: [
                            {
                                collectorId: 1,
                                firstName: 'María',
                                lastName: 'García',
                                clientsCount: 45,
                                collected: 450000,
                                target: 400000,
                                percent: 113,
                            },
                            {
                                collectorId: 2,
                                firstName: 'Pedro',
                                lastName: 'Martín',
                                clientsCount: 32,
                                collected: 320000,
                                target: 400000,
                                percent: 80,
                            },
                        ],
                        recentPayments: [
                            {
                                paymentId: 123,
                                paymentDate: '2025-10-15T10:00:00.000Z',
                                amount: 125000,
                                appliedAmount: 125000,
                                status: 'Completed',
                                collector: { id: 2, firstName: 'Pedro', lastName: 'Martín' },
                                customer: { id: 99, firstName: 'Empresa', lastName: 'S.A.S.' },
                            },
                            {
                                paymentId: 124,
                                paymentDate: '2025-10-16T09:30:00.000Z',
                                amount: 98000,
                                appliedAmount: 98000,
                                status: 'Completed',
                                collector: { id: 1, firstName: 'María', lastName: 'García' },
                                customer: { id: 120, firstName: 'Carlos', lastName: 'López' },
                            },
                        ],
                    },
                },
            },
        }),
    );
}