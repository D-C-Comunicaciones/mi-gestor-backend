import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces'

export async function interestsReportTemplate(data: any): Promise<TDocumentDefinitions> {
    return {
        background: (currentPage: number, pageSize: { width: number; height: number }): Content[] => {
            const backgrounds: Content[] = []
            if (data.watermarkLogo) {
                backgrounds.push({
                    image: data.watermarkLogo,
                    width: 300,
                    opacity: 0.08,
                    absolutePosition: {
                        x: (pageSize.width - 300) / 2,
                        y: (pageSize.height - 300) / 2,
                    },
                } as any)
            }

            if (data.verticalTextBase64) {
                backgrounds.push({
                    svg: data.verticalTextBase64,
                    width: 100,
                    height: pageSize.height,
                    absolutePosition: {
                        x: pageSize.width - 40,
                        y: 0,
                    },
                })
            }

            return backgrounds
        },

        content: [
            // ✅ Encabezado
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                columns: [
                                    data.headerLogo
                                        ? { image: data.headerLogo, width: 80, alignment: 'left' }
                                        : { text: '' },
                                    {
                                        text: data.reportTitle || 'REPORTE DE INTERESES CORRIENTES',
                                        style: 'header',
                                        alignment: 'right',
                                        margin: [0, 10, 0, 0],
                                    },
                                ],
                            },
                        ],
                    ],
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 10],
            },

            { text: `Generado el: ${data.generatedAt || new Date().toLocaleDateString('es-CO')}`, alignment: 'right', fontSize: 9, margin: [0, 5, 0, 10] },
            { text: `Período: ${data.startDate || '-'} - ${data.endDate || '-'}`, alignment: 'right', fontSize: 9, margin: [0, 0, 0, 10] },

            // 🔹 Resumen General
            { text: 'RESUMEN GENERAL', style: 'subheader', margin: [0, 10, 0, 5] },
            {
                table: {
                    headerRows: 1,
                    widths: ['25%', '20%', '20%', '20%', '15%'],
                    body: [
                        [
                            { text: 'Concepto', style: 'tableHeader' },
                            { text: 'Monto', style: 'tableHeader' },
                            { text: 'Pagos', style: 'tableHeader' },
                            { text: 'Clientes', style: 'tableHeader' },
                            { text: '—', style: 'tableHeader' },
                        ],
                        ['Interés', `$${(data.summary?.totalInterestCollected ?? 0)}`, '', '', ''],
                        ['Capital', `$${(data.summary?.totalCapitalCollected ?? 0)}`, '', '', ''],
                        ['Mora', `$${(data.summary?.totalLateFeeCollected ?? 0)}`, '', '', ''],
                        ['TOTAL', `$${(data.summary?.totalCollected ?? 0)}`, data.summary?.totalPayments ?? 0, data.summary?.totalCustomers ?? 0, ''],
                    ],
                },
                layout: 'lightHorizontalLines',
            },

            data.summaryChartBase64
                ? {
                    image: data.summaryChartBase64,
                    width: 350,
                    alignment: 'center',
                    margin: [0, 15, 0, 10],
                }
                : {},

            // 🔹 Detalle por cliente
            { text: 'DETALLE DE INTERESES POR CLIENTE', style: 'subheader', margin: [0, 20, 0, 8] },

            ...(data.data || []).flatMap((customer: any) => [
                { text: `Cliente: ${customer.customerName} (${customer.customerDocument})`, style: 'subheader', margin: [0, 10, 0, 4] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['10%', '15%', '15%', '15%', '20%', '25%'],
                        body: [
                            ['ID Pago', 'Interés', 'Capital', 'Mora', 'Cobrador', 'Fecha'].map((t) => ({
                                text: t,
                                style: 'tableHeader',
                            })),
                            ...(customer.records || []).map((r: any) => [
                                { text: r.paymentId || '—', alignment: 'center' },
                                { text: `$${(r.interestCollected ?? 0)}`, alignment: 'right' },
                                { text: `$${(r.capitalCollected ?? 0)}`, alignment: 'right' },
                                { text: `$${(r.lateFeeCollected ?? 0)}`, alignment: 'right' },
                                { text: r.collectorName || '—', alignment: 'left' },
                                { text: r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('es-CO') : '—', alignment: 'center' },
                            ]),
                            [
                                { text: 'Totales', bold: true },
                                { text: `$${(customer.totalInterestCollected ?? 0)}`, bold: true, alignment: 'right' },
                                { text: `$${(customer.totalCapitalCollected ?? 0)}`, bold: true, alignment: 'right' },
                                { text: `$${(customer.totalLateFeeCollected ?? 0)}`, bold: true, alignment: 'right' },
                                { text: '', alignment: 'center' },
                                { text: `$${(customer.totalCollected ?? 0)}`, bold: true, alignment: 'right' },
                            ],
                        ],
                    },
                    layout: 'lightHorizontalLines',
                },
            ]),
        ],

        styles: {
            header: { fontSize: 14, bold: true, alignment: 'right' },
            subheader: { fontSize: 11, bold: true, color: '#333' },
            tableHeader: {
                fillColor: '#4bc0c0',
                color: '#fff',
                bold: true,
                fontSize: 8,
                alignment: 'center',
            },
        },

        defaultStyle: { font: 'Helvetica', fontSize: 8 },
        pageMargins: [50, 60, 40, 50],
        pageSize: 'LETTER',
        pageOrientation: 'portrait',

        footer: (currentPage: number, pageCount: number) => ({
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'center',
            fontSize: 8,
            color: '#666666',
            margin: [0, 10, 0, 0],
        }),

        info: {
            title: data.reportTitle || 'Reporte de Intereses Corrientes',
            author: 'Sistema de Gestión de Créditos',
            subject: `Reporte del período ${data.startDate || '-'} al ${data.endDate || '-'}`,
            creator: 'MiGestor',
            producer: 'MiGestor PDF Generator',
            creationDate: new Date(),
        },
    }
}