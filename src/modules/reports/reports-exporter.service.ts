import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';
import { ResponseLoanSummaryReportDto } from './dto';
import * as path from 'path';
import * as fs from 'fs';
import { join } from 'path';
import { envs } from '@config/envs';
import { CollectionReportData, LoansReportData } from '@templates/reports/interfaces';
import { collectionsReportTemplate } from '@templates/reports/collections-report.template';
import { loansReportTemplate } from '@templates/reports/loans-report.template';

Chart.register(...registerables);

// Define font files
const fonts = {
    Roboto: {
        normal: join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
        bold: join(process.cwd(), 'public', 'fonts', 'Roboto-Medium.ttf'),
        italics: join(process.cwd(), 'public', 'fonts', 'Roboto-Italic.ttf'),
        bolditalics: join(process.cwd(), 'public', 'fonts', 'Roboto-MediumItalic.ttf'),
    },
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

@Injectable()
export class ReportExporterService {
    private readonly logger = new Logger(ReportExporterService.name);
    private printer = new PdfPrinter(fonts);

    constructor() { }

    /**
     * Genera reporte de recaudos en PDF usando plantilla
     */
    async generateCollectionReportPdf(reportData: CollectionReportData): Promise<Buffer> {
        try {
            // 🎯 Generar gráficas antes de crear el template
            let globalPerformanceChartBase64 = '';
            let comparisonChartBase64 = '';
            const { headerLogo, watermarkLogo } = this.getLogosBase64();
            const verticalTextBase64 = await this.getVerticalTextBase64(envs.verticalTextReports, 792);

            try {
                const globalChartBuffer = await this.generateGlobalPerformanceChart(reportData);
                globalPerformanceChartBase64 = `data:image/png;base64,${globalChartBuffer.toString('base64')}`;
            } catch (error) {
                this.logger.warn('Error generando gráfica de rendimiento global:', error.message);
            }

            try {
                const comparisonChartBuffer = await this.generateCollectorComparisonChart(reportData);
                comparisonChartBase64 = `data:image/png;base64,${comparisonChartBuffer.toString('base64')}`;
            } catch (error) {
                this.logger.warn('Error generando gráfica de comparación:', error.message);
            }

            // 🎯 Mapear los datos para que coincidan con la interfaz del template
            const templateData: CollectionReportData = {
                reportDate: new Date().toLocaleDateString(envs.appLocale),
                startDate: reportData.startDate,
                endDate: reportData.endDate,
                headerLogo: headerLogo,
                watermarkLogo: watermarkLogo,
                verticalTextBase64: verticalTextBase64, // 🎯 Agregar texto vertical
                globalPerformanceChartBase64, // 🎯 Agregar gráfica de rendimiento global
                comparisonChartBase64, // 🎯 Agregar gráfica de comparación
                summary: {
                    globalPerformancePercentage: reportData.summary.globalPerformancePercentage,
                    totalAssigned: reportData.summary.totalAssigned,
                    totalCollected: reportData.summary.totalCollected,
                    totalCollections: reportData.summary.totalCollections,
                    activeCollectors: reportData.summary.activeCollectors,
                    averageCollectedPerCollector: reportData.summary.averageCollectedPerCollector,
                    bestCollector: {
                        name: reportData.summary.bestCollector.name,
                        percentage: reportData.summary.bestCollector.percentage,
                        collected: reportData.summary.bestCollector.collected,
                    },
                    worstCollector: {
                        name: reportData.summary.worstCollector.name,
                        percentage: reportData.summary.worstCollector.percentage,
                        collected: reportData.summary.worstCollector.collected,
                    },
                },
                // 🎯 Mapear collectorSummary con los campos correctos
                collectorSummary: reportData.collectorSummary.map((collector: any) => ({
                    collectorName: collector.collectorName,
                    collectorRoute: collector.collectorRoute, // 🎯 Usar collectorRoute
                    totalAssigned: collector.totalAssigned,
                    totalCollected: collector.totalCollected,
                    totalCollectionsMade: collector.totalCollectionsMade, // 🎯 Usar totalCollectionsMade
                    performancePercentage: collector.performancePercentage,
                    averageCollectionAmount: collector.averageCollectionAmount,
                })),
                // 🎯 Mapear collections con los campos correctos
                collections: reportData.collections.map((collection: any) => ({
                    paymentDate: collection.paymentDate,
                    loanId: collection.loanId.toString(),
                    customerName: collection.customerName,
                    collectorName: collection.collectorName,
                    collectorRoute: collection.collectorRoute, // 🎯 Usar collectorRoute
                    amount: collection.amount,
                })),
            };

            const docDefinition = await collectionsReportTemplate(templateData);
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', (err) => {
                    pdfDoc.end();
                    reject(err);
                });
                pdfDoc.end();
            });

        } catch (error) {
            this.logger.error('Error generando PDF de reporte de cobros:', error);
            throw new Error(`Error al generar PDF: ${error.message}`);
        }
    }

    /**
     * Genera reporte de recaudos en Excel
     */
    async generateCollectionReportExcel(data: any): Promise<Buffer> {
        // Validar que data tenga la estructura esperada
        if (!data || typeof data !== 'object') {
            throw new Error('Los datos del reporte son inválidos o están vacíos');
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Recaudos');

        const collections = data.collections || [];
        const summary = data.summary || {};
        const collectorSummary = data.collectorSummary || [];

        // 1. Encabezado y Resumen
        worksheet.getCell('A1').value = 'REPORTE DE RECAUDOS POR COBRADOR';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.getCell('A3').value = `Período: ${data.startDate || 'N/A'} - ${data.endDate || 'N/A'}`;
        worksheet.getCell('A3').font = { bold: true };

        // Resumen general
        worksheet.getCell('A5').value = 'RESUMEN GENERAL';
        worksheet.getCell('A5').font = { bold: true, size: 14 };
        worksheet.getCell('A6').value = 'Total de Recaudos:';
        worksheet.getCell('B6').value = summary.totalCollections || 0;
        worksheet.getCell('A7').value = 'Monto Total Recaudado:';
        worksheet.getCell('B7').value = summary.totalCollected || 0;
        worksheet.getCell('B7').numFmt = '$#,##0.00';

        // 2. Resumen por Cobrador
        let currentRow = 10;

        if (collectorSummary.length > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'RESUMEN POR COBRADOR';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
            currentRow += 2;

            worksheet.addTable({
                name: 'CollectorSummaryTable',
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'Cobrador', filterButton: true },
                    { name: 'Zona', filterButton: true },
                    { name: 'Total Asignado', filterButton: true },
                    { name: 'Total Recaudado', filterButton: true },
                    { name: 'Rendimiento %', filterButton: true },
                    { name: 'Cantidad de Cobros', filterButton: true },
                    { name: 'Promedio por Cobro' }
                ],
                rows: collectorSummary.map(c => [
                    c.collectorName || '',
                    c.zoneName || '',
                    c.totalAssigned || 0,
                    c.totalCollected || 0,
                    c.performancePercentage || 0,
                    c.totalCollectionsMade || c.collectionsCount || c.paymentsRegistered || 0,
                    c.averageCollectionAmount || 0
                ]),
            });

            currentRow += collectorSummary.length + 3;
        }

        // 3. Detalle de Recaudos
        if (collections.length > 0) {
            worksheet.getCell(`A${currentRow}`).value = 'DETALLE DE RECAUDOS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
            currentRow += 2;

            worksheet.addTable({
                name: 'CollectionsTable',
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'Fecha', filterButton: true },
                    { name: 'Cobrador', filterButton: true },
                    { name: 'Cliente', filterButton: true },
                    { name: 'ID Crédito', filterButton: true },
                    { name: 'Zona', filterButton: true },
                    { name: 'Monto Recaudado' }
                ],
                rows: collections.map(c => [
                    c.paymentDate?.split(' ')[0] || '',
                    c.collectorName || '',
                    c.customerName || '',
                    c.loanId || '',
                    c.zoneName || '',
                    c.amount || 0
                ]),
            });

            // Aplicar formato de moneda
            worksheet.getColumn(4).numFmt = '$#,##0.00'; // Total Asignado
            worksheet.getColumn(5).numFmt = '$#,##0.00'; // Total Recaudado
            worksheet.getColumn(6).numFmt = '0.00"%"';   // Rendimiento %
            worksheet.getColumn(8).numFmt = '$#,##0.00'; // Promedio por Cobro

            // Para la tabla de detalle
            const detailTableCol = currentRow > 20 ? 6 : 6; // Columna de monto en detalle
            worksheet.getColumn(detailTableCol).numFmt = '$#,##0.00';
        }

        // Ajustar ancho de columnas
        worksheet.columns.forEach((column) => {
            let maxLength = 0;
            if (typeof column.eachCell === 'function') {
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnText = cell.text;
                    if (columnText) {
                        maxLength = Math.max(maxLength, columnText.toString().length);
                    }
                });
            }
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

   async generateLoanReportExcel(reportData: any): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Créditos');

        // Configurar columnas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Fecha', key: 'startDate', width: 12 },
            { header: 'Cliente', key: 'customerName', width: 30 },
            { header: 'Documento', key: 'customerDocument', width: 15 },
            { header: 'Tipo', key: 'creditTypeName', width: 20 },
            { header: 'Monto', key: 'loanAmount', width: 15 },
            { header: 'Saldo', key: 'remainingBalance', width: 15 },
            { header: 'Interés %', key: 'interestRateValue', width: 12 },
            { header: 'Estado', key: 'loanStatusName', width: 15 },
        ];

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4bc0c0' },
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Agregar créditos nuevos
        if (reportData.newLoansDetails && reportData.newLoansDetails.length > 0) {
            worksheet.addRow({});
            const newLoansHeaderRow = worksheet.addRow(['CRÉDITOS NUEVOS']);
            newLoansHeaderRow.font = { bold: true, size: 14 };
            newLoansHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00aa00' },
            };

            reportData.newLoansDetails.forEach((loan: any) => {
                worksheet.addRow({
                    id: loan.id,
                    startDate: loan.startDate,
                    customerName: loan.customerName,
                    customerDocument: loan.customerDocument,
                    creditTypeName: loan.creditTypeName,
                    loanAmount: loan.loanAmount,
                    remainingBalance: loan.remainingBalance,
                    interestRateValue: loan.interestRateValue,
                    loanStatusName: loan.loanStatusName,
                });
            });

            // Totales de créditos nuevos
            const newLoansTotalRow = worksheet.addRow({
                id: '',
                startDate: '',
                customerName: '',
                customerDocument: '',
                creditTypeName: 'TOTAL NUEVOS:',
                loanAmount: reportData.newLoansTotalAmount,
                remainingBalance: '',
                interestRateValue: '',
                loanStatusName: '',
            });
            newLoansTotalRow.font = { bold: true };
            newLoansTotalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0F7E0' },
            };
        }

        // Agregar créditos refinanciados
        if (reportData.refinancedLoansDetails && reportData.refinancedLoansDetails.length > 0) {
            worksheet.addRow({});
            const refinancedHeaderRow = worksheet.addRow(['CRÉDITOS REFINANCIADOS']);
            refinancedHeaderRow.font = { bold: true, size: 14 };
            refinancedHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFffaa00' },
            };

            reportData.refinancedLoansDetails.forEach((loan: any) => {
                worksheet.addRow({
                    id: loan.id,
                    startDate: loan.startDate,
                    customerName: loan.customerName,
                    customerDocument: loan.customerDocument,
                    creditTypeName: loan.creditTypeName,
                    loanAmount: loan.loanAmount,
                    remainingBalance: loan.remainingBalance,
                    interestRateValue: loan.interestRateValue,
                    loanStatusName: loan.loanStatusName,
                });
            });

            // Totales de créditos refinanciados
            const refinancedTotalRow = worksheet.addRow({
                id: '',
                startDate: '',
                customerName: '',
                customerDocument: '',
                creditTypeName: 'TOTAL REFINANCIADOS:',
                loanAmount: reportData.refinancedLoansTotalAmount,
                remainingBalance: '',
                interestRateValue: '',
                loanStatusName: '',
            });
            refinancedTotalRow.font = { bold: true };
            refinancedTotalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFE0B2' },
            };
        }

        // Resumen global
        worksheet.addRow({});
        const summaryHeaderRow = worksheet.addRow(['RESUMEN GLOBAL']);
        summaryHeaderRow.font = { bold: true, size: 14 };
        summaryHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4bc0c0' },
        };

        worksheet.addRow({
            id: 'Total Créditos:',
            startDate: reportData.summary.totalLoans,
            customerName: '',
            customerDocument: '',
            creditTypeName: '',
            loanAmount: '',
            remainingBalance: '',
            interestRateValue: '',
            loanStatusName: '',
        });

        worksheet.addRow({
            id: 'Monto Total:',
            startDate: reportData.summary.totalAmount,
            customerName: '',
            customerDocument: '',
            creditTypeName: '',
            loanAmount: '',
            remainingBalance: '',
            interestRateValue: '',
            loanStatusName: '',
        });

        worksheet.addRow({
            id: 'Promedio:',
            startDate: reportData.summary.averageLoanAmount.toFixed(2),
            customerName: '',
            customerDocument: '',
            creditTypeName: '',
            loanAmount: '',
            remainingBalance: '',
            interestRateValue: '',
            loanStatusName: '',
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async generateLoanReportPdf(reportData: any): Promise<Buffer> {
        this.logger.log('Generando reporte de préstamos en PDF');

        try {
            // 🔹 Obtener logos base64
            let headerLogo = '';
            let watermarkLogo = '';
            try {
                const logos = this.getLogosBase64();
                headerLogo = logos.headerLogo || '';
                watermarkLogo = logos.watermarkLogo || '';
            } catch (err) {
                this.logger.warn('No se pudieron cargar los logos:', err.message);
            }

            // 🔹 Generar gráficos en try/catch individual
            let newLoansChartBase64 = '';
            let comparisonChartBase64 = '';

            try {
                const allLoans = [
                    ...(reportData.newLoansDetails || []),
                    ...(reportData.refinancedLoansDetails || []),
                ];
                
                if (allLoans.length > 0) {
                    this.logger.log(`Generando gráfica de distribución por tipo (${allLoans.length} créditos)`);
                    const newLoansChartBuffer = await this.generateLoanTypeChart(allLoans);
                    newLoansChartBase64 = `data:image/png;base64,${newLoansChartBuffer.toString('base64')}`;
                    this.logger.log('✅ Gráfica de distribución generada correctamente');
                }
            } catch (err) {
                this.logger.error('❌ Error generando gráfica de distribución:', err.message);
            }

            try {
                const allLoans = [
                    ...(reportData.newLoansDetails || []),
                    ...(reportData.refinancedLoansDetails || []),
                ];
                this.logger.log(`Generando gráfica comparativa (${allLoans.length} créditos totales)`);
                const comparisonChartBuffer = await this.generateLoanComparisonChart(allLoans);
                comparisonChartBase64 = `data:image/png;base64,${comparisonChartBuffer.toString('base64')}`;
                this.logger.log('✅ Gráfica comparativa generada correctamente');
            } catch (err) {
                this.logger.error('❌ Error generando gráfica comparativa:', err.message);
            }

            // 🔹 Generar texto vertical
            const verticalTextBase64 = await this.getVerticalTextBase64(envs.verticalTextReports, 792);

            // 🔹 Mapear datos para la plantilla
            const templateData: LoansReportData = {
                ...reportData,
                headerLogo,
                watermarkLogo,
                verticalTextBase64,
                newLoansChartBase64,
                comparisonChartBase64,
                reportDate: reportData.metadata?.generatedAt || new Date().toLocaleDateString(),
            };

            this.logger.log('📄 Generando documento PDF con plantilla...');
            const docDefinition = await loansReportTemplate(templateData);

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => {
                    this.logger.log('✅ PDF generado exitosamente');
                    resolve(Buffer.concat(chunks));
                });
                pdfDoc.on('error', (err) => {
                    pdfDoc.end();
                    this.logger.error('❌ Error al generar PDF:', err);
                    reject(err);
                });
                pdfDoc.end();
            });

        } catch (error) {
            this.logger.error('Error generando PDF de préstamos:', error);
            throw new Error(`Error al generar PDF: ${error.message}`);
        }
    }

    // -----------------------------------------------------------
    // MÉTODOS AUXILIARES
    // -----------------------------------------------------------

    private async generateGlobalPerformanceChart(data: any): Promise<Buffer> {
        try {
            const canvas = createCanvas(400, 300);
            const summary = data.summary || {};

            const globalPerformance = this.sanitizeNumber(summary.globalPerformancePercentage);
            const remaining = Math.max(0, 100 - globalPerformance);

            this.logger.log(`Generando gráfica de rendimiento global: ${globalPerformance}%`);

            new Chart(canvas as any, {
                type: 'doughnut',
                data: {
                    labels: [
                        `Rendimiento Actual (${globalPerformance.toFixed(1)}%)`,
                        `Por Alcanzar (${remaining.toFixed(1)}%)`
                    ],
                    datasets: [{
                        data: [globalPerformance, remaining],
                        backgroundColor: [
                            globalPerformance >= 85 ? '#00aa00' : globalPerformance >= 70 ? '#ffaa00' : '#ff6384',
                            '#e0e0e0'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Rendimiento Global: ${globalPerformance.toFixed(1)}%`,
                            font: { size: 16, weight: 'bold' },
                            color: '#000000' // ✅ Negro nítido
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                font: { size: 10 },
                                padding: 8,
                                color: '#000000' // ✅ Negro nítido
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    return `${label}: ${value.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateGlobalPerformanceChart:', error);
            throw error;
        }
    }

    private async generateCollectorComparisonChart(data: any): Promise<Buffer> {
        try {
            const canvas = createCanvas(500, 300);
            const collectorSummary = data.collectorSummary || [];

            if (!collectorSummary || collectorSummary.length === 0) {
                this.logger.warn('No hay datos de cobradores para la gráfica');
                return this.createEmptyChart(canvas, 'Comparación de Cobradores: Sin Datos');
            }

            // Tomar solo los primeros 5 cobradores para mejor visualización
            const topCollectors = collectorSummary.slice(0, 5);
            const labels = topCollectors.map(c => (c.collectorName || 'Sin Nombre').split(' ')[0]); // Solo primer nombre
            const percentages = topCollectors.map(c => this.sanitizeNumber(c.performancePercentage));
            const collected = topCollectors.map(c => this.sanitizeNumber(c.totalCollected));

            this.logger.log(`Generando gráfica de comparación con ${topCollectors.length} cobradores`);

            new Chart(canvas as any, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Rendimiento (%)',
                        data: percentages,
                        backgroundColor: percentages.map(p =>
                            p >= 85 ? '#00aa00' : p >= 70 ? '#ffaa00' : '#ff6384'
                        ),
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Top 5 - Rendimiento por Cobrador',
                            font: { size: 14, weight: 'bold' },
                            color: '#000000' // ✅ Negro nítido
                        },
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const collectorName = topCollectors[context.dataIndex].collectorName;
                                    const percentage = percentages[context.dataIndex];
                                    const amount = collected[context.dataIndex];
                                    return [
                                        `${collectorName}`,
                                        `Rendimiento: ${percentage.toFixed(1)}%`,
                                        `Recaudado: $${amount.toLocaleString()}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function (value) {
                                    return value + '%';
                                },
                                color: '#000000' // ✅ Negro nítido
                            },
                            title: {
                                display: false
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                color: '#000000' // ✅ Negro nítido
                            }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateCollectorComparisonChart:', error);
            // En caso de error, crear gráfica vacía
            return this.createEmptyChart(createCanvas(500, 300), 'Error al generar gráfica');
        }
    }

    private createEmptyChart(canvas: any, title: string): Buffer {
        try {
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Sin datos'],
                    datasets: [{
                        label: 'No hay información disponible',
                        data: [0],
                        backgroundColor: '#cccccc',
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: title,
                            font: { size: 14 },
                            color: '#000000' // ✅ Negro nítido
                        },
                        legend: { 
                            display: false 
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: {
                                color: '#000000' // ✅ Negro nítido
                            }
                        },
                        x: {
                            ticks: {
                                color: '#000000' // ✅ Negro nítido
                            }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error creando gráfica vacía:', error);
            // Crear un canvas completamente vacío como fallback
            const emptyCanvas = createCanvas(400, 300);
            const ctx = emptyCanvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 400, 300);
            ctx.fillStyle = '#000000'; // ✅ Negro nítido
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Gráfica no disponible', 200, 150);
            return emptyCanvas.toBuffer('image/png');
        }
    }

    /**
     * Genera un PNG en base64 con texto vertical rotado -90°
     */

    async getVerticalTextBase64(
        text: string,
        height: number,
        fontSize: number = 10
    ): Promise<string> {
        const start = Date.now();

        try {
            const escapeXml = (unsafe: string) =>
                unsafe
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');

            const safeText = escapeXml(text);
            const yPos = height / 2 + 25;

            const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="${height}">
  <text x="20" y="${yPos}" 
        text-anchor="middle"
        font-size="${fontSize}" 
        fill="black"
        fill-opacity="0.35"
        font-family="Arial, sans-serif"
        transform="rotate(90, 20, ${yPos})">
    ${safeText}
  </text>
</svg>`.trim(); // 👈 importante el trim()


            return svg;

        } catch (error: any) {
            console.error('❌ [getVerticalTextBase64] Error generando texto vertical:', error.message);
            throw error;
        }
    }

    private sanitizeNumber(value: any): number {
        if (value === null || value === undefined || value === '' || value === 'NaN') {
            return 0;
        }

        let cleanValue = String(value).replace(/[^0-9.-]/g, '');
        const num = Number(cleanValue);

        if (isNaN(num) || !isFinite(num)) {
            return 0;
        }

        return num;
    }

    private getLogosBase64(): { headerLogo: string; watermarkLogo: string } {
        try {
            const publicPath = path.join(process.cwd(), 'public/logos');
            const logoExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];

            let headerLogo: string | null = null;
            let watermarkLogo: string | null = null;

            for (const ext of logoExtensions) {
                const logoPath = path.join(publicPath, `logo${ext}`);
                if (!headerLogo && fs.existsSync(logoPath)) {
                    this.logger.log(`Logo encontrado: ${logoPath}`);
                    headerLogo = this.encodeImage(logoPath, ext);
                }

                const defaultLogoPath = path.join(publicPath, `defaultLogo${ext}`);
                if (!watermarkLogo && fs.existsSync(defaultLogoPath)) {
                    this.logger.log(`Logo por defecto encontrado: ${defaultLogoPath}`);
                    watermarkLogo = this.encodeImage(defaultLogoPath, ext);
                }

                // Si ya encontramos ambos, podemos salir del loop
                if (headerLogo && watermarkLogo) break;
            }

            // ⚠️ Fallbacks si no se encontró algo
            if (!headerLogo) {
                this.logger.warn('No se encontró logo, se usará defaultLogo como headerLogo');
                headerLogo = watermarkLogo ?? this.getFallbackSvg();
            }

            if (!watermarkLogo) {
                this.logger.warn('No se encontró defaultLogo, se usará fallback');
                watermarkLogo = this.getFallbackSvg();
            }

            return {
                headerLogo,
                watermarkLogo,
            };
        } catch (error) {
            this.logger.error('Error al cargar logos:', error);
            const fallback = this.getFallbackSvg();
            return {
                headerLogo: fallback,
                watermarkLogo: fallback,
            };
        }
    }

    private encodeImage(filePath: string, ext: string): string {
        const lowerExt = ext.toLowerCase();

        if (lowerExt === '.svg') {
            // SVG se lee como texto
            const svgContent = fs.readFileSync(filePath, 'utf8');
            return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
        }

        // Otros formatos binarios
        const buffer = fs.readFileSync(filePath);
        const mimeType = this.getMimeType(lowerExt);
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    private getFallbackSvg(): string {
        const fallbackSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
            <rect width="100%" height="100%" fill="lightgray"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="black">
                SIN LOGO
            </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`;
    }

    private getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };

        return mimeTypes[extension] || 'image/png';
    }

    /**
     * Genera gráfica de tipos de crédito con porcentajes
     */
    private async generateLoanTypeChart(loans: any[]): Promise<Buffer> {
        try {
            const canvas = createCanvas(450, 300);
            
            // Agrupar por tipo de crédito (usar el campo creditTypeName que ya está traducido)
            const typeCounts: { [key: string]: number } = {};
            loans.forEach(l => {
                const type = l.creditTypeName || l.loanTypeName || 'Sin tipo';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            const labels = Object.keys(typeCounts);
            const dataCounts = Object.values(typeCounts);
            const total = dataCounts.reduce((sum, val) => sum + val, 0);

            if (labels.length === 0) {
                this.logger.warn('No hay datos de tipos de crédito para graficar');
                return this.createEmptyChart(canvas, 'Sin datos de tipos de crédito');
            }

            // Calcular porcentajes
            const percentages = dataCounts.map(count => ((count / total) * 100).toFixed(1));
            const labelsWithPercentage = labels.map((label, i) => `${label} (${percentages[i]}%)`);

            this.logger.log(`Generando gráfica con ${labels.length} tipos: ${labels.join(', ')}`);

            new Chart(canvas as any, {
                type: 'doughnut',
                data: {
                    labels: labelsWithPercentage,
                    datasets: [{
                        data: dataCounts,
                        backgroundColor: [
                            '#4bc0c0',
                            '#ff6384',
                            '#36a2eb',
                            '#ffce56',
                            '#9966ff',
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución por Tipo de Crédito',
                            font: { size: 14, weight: 'bold' },
                            color: '#000000' // ✅ Negro nítido
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                font: { size: 10 },
                                padding: 8,
                                color: '#000000' // ✅ Negro nítido
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = labels[context.dataIndex];
                                    const value = context.parsed;
                                    const percentage = percentages[context.dataIndex];
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateLoanTypeChart:', error);
            return this.createEmptyChart(createCanvas(450, 300), 'Error al generar gráfica');
        }
    }

    /**
     * Genera gráfica comparativa de créditos nuevos vs refinanciados con porcentajes
     */
    private async generateLoanComparisonChart(loans: any[]): Promise<Buffer> {
        try {
            const canvas = createCanvas(500, 300);
            
            // Contar nuevos vs refinanciados (usando el campo loanStatusName traducido)
            const statusCounts: { [key: string]: number } = {
                'Nuevos': 0,
                'Refinanciados': 0,
            };

            loans.forEach(l => {
                const status = l.loanStatusName || l.loanStatusOriginal || '';
                if (status.toLowerCase().includes('refinanciado') || status.toLowerCase().includes('refinanced')) {
                    statusCounts['Refinanciados']++;
                } else {
                    statusCounts['Nuevos']++;
                }
            });

            const labels = Object.keys(statusCounts).filter(k => statusCounts[k] > 0);
            const dataCounts = labels.map(k => statusCounts[k]);
            const total = dataCounts.reduce((sum, val) => sum + val, 0);
            const percentages = dataCounts.map(count => ((count / total) * 100).toFixed(1));

            if (labels.length === 0) {
                this.logger.warn('No hay datos para comparación');
                return this.createEmptyChart(canvas, 'Sin datos para comparación');
            }

            this.logger.log(`Generando gráfica comparativa: ${labels.map((l, i) => `${l}: ${dataCounts[i]} (${percentages[i]}%)`).join(', ')}`);

            new Chart(canvas as any, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Cantidad de Créditos',
                        data: dataCounts,
                        backgroundColor: [
                            '#00aa00',
                            '#ffaa00',
                        ],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Créditos Nuevos vs Refinanciados',
                            font: { size: 14, weight: 'bold' },
                            color: '#000000' // ✅ Negro nítido
                        },
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const percentage = percentages[context.dataIndex];
                                    return `Cantidad: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value;
                                },
                                color: '#000000' // ✅ Negro nítido
                            }
                        },
                        x: {
                            ticks: {
                                color: '#000000' // ✅ Negro nítido
                            }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateLoanComparisonChart:', error);
            return this.createEmptyChart(createCanvas(500, 300), 'Error al generar gráfica');
        }
    }
}
