import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';
import * as path from 'path';
import * as fs from 'fs';
import { join } from 'path';
import { envs } from '@config/envs';
import { LoanDetail } from './handlers/interfaces/loans';
import { MoratoryInterestReport } from './handlers/interfaces/moratory-interest';
import { CollectionReportData } from '@templates/reports/interfaces';
import { loansReportTemplate, collectionsReportTemplate, moratoryInterestsReportTemplate, interestsReportTemplate } from '@templates/index';
import { LoanReportData } from '@templates/reports/interfaces';
import { InterestsReport } from './handlers';

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
 * Genera reporte de créditos en Excel
 */
    async generateLoanReportExcel(reportData: LoanReportData): Promise<Buffer> {
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

            reportData.newLoansDetails.forEach((loan: LoanDetail) => {
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
                loanAmount: reportData.newLoansDetails[Symbol.iterator]().next().value.newLoansTotalAmount,
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
                loanAmount: reportData.refinancedLoansDetails[Symbol.iterator]().next().value.refinancedLoansTotalAmount,
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

    /**
     * Genera reporte de préstamos en PDF
     */
    async generateLoanReportPdf(reportData: LoanReportData): Promise<Buffer> {
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
            const templateData: LoanReportData = {
                ...reportData,
                headerLogo,
                watermarkLogo,
                verticalTextBase64,
                newLoansChartBase64,
                comparisonChartBase64,
                reportDate: new Date().toLocaleDateString(),
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

    /**
     * Genera reporte de recaudos en PDF usando plantilla
     */
    async generateCollectionReportPdf(reportData: CollectionReportData): Promise<Buffer> {
        try {
            // Logos y texto vertical
            const { headerLogo, watermarkLogo } = this.getLogosBase64();
            const verticalTextBase64 = await this.getVerticalTextBase64(envs.verticalTextReports, 792);

            // 🎯 Generar gráficas
            let globalPerformanceChartBase64 = '';
            let comparisonChartBase64 = '';

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

            // Mapear datos para el template
            const templateData: CollectionReportData = {
                ...reportData,
                reportDate: new Date().toLocaleDateString(envs.appLocale),
                headerLogo,
                watermarkLogo,
                verticalTextBase64,
                globalPerformanceChartBase64,
                comparisonChartBase64,
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
    async generateCollectionReportExcel(reportData: CollectionReportData): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Recaudos');

        const { collections, summary, collectorSummary, startDate, endDate } = reportData;

        // 1. Encabezado
        worksheet.getCell('A1').value = 'REPORTE DE RECAUDOS POR COBRADOR';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.getCell('A3').value = `Período: ${startDate || 'N/A'} - ${endDate || 'N/A'}`;
        worksheet.getCell('A3').font = { bold: true };

        // 2. Resumen general
        worksheet.getCell('A5').value = 'RESUMEN GENERAL';
        worksheet.getCell('A5').font = { bold: true, size: 14 };
        worksheet.getCell('A6').value = 'Total de Recaudos:';
        worksheet.getCell('B6').value = summary.totalCollections || 0;
        worksheet.getCell('A7').value = 'Monto Total Recaudado:';
        worksheet.getCell('B7').value = summary.totalCollected || 0;
        worksheet.getCell('B7').numFmt = '$#,##0.00';

        // 3. Resumen por cobrador
        let currentRow = 10;
        if (collectorSummary.length) {
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
                    c.collectorName,
                    c.collectorRoute,
                    c.totalAssigned,
                    c.totalCollected,
                    c.performancePercentage,
                    c.totalCollectionsMade,
                    c.averageCollectionAmount
                ])
            });

            currentRow += collectorSummary.length + 3;
        }

        // 4. Detalle de cobros
        if (collections.length) {
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
                    c.collectorName,
                    c.customerName,
                    c.loanId,
                    c.collectorRoute,
                    c.amount
                ])
            });
        }

        // Ajustar ancho de columnas automáticamente
        worksheet.columns.forEach(col => {
            let maxLength = 10;
            if (typeof col.eachCell === 'function') {
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const text = cell.value ? String(cell.value) : '';
                    maxLength = Math.max(maxLength, text.length + 2);
                });
            }
            col.width = maxLength;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Genera reporte de intereses moratorios en PDF
     */
    async generateMoratoryInterestReportPdf(reportData: MoratoryInterestReport): Promise<Buffer> {
        try {
            const { headerLogo, watermarkLogo } = this.getLogosBase64();
            const verticalTextBase64 = await this.getVerticalTextBase64(envs.verticalTextReports, 792);

            // 📊 Intentar generar la gráfica resumen (opcional)
            let summaryChartBase64 = '';
            try {
                const chartBuffer = await this.generateSimpleSummaryChart(reportData.summary);
                summaryChartBase64 = `data:image/png;base64,${chartBuffer.toString('base64')}`;
            } catch (error) {
                this.logger.warn('Error generando gráfica resumen:', error.message);
            }

            const templateData = {
                ...reportData,
                reportDate: new Date().toLocaleDateString(envs.appLocale),
                headerLogo,
                watermarkLogo,
                verticalTextBase64,
                summaryChartBase64,
            };

            const docDefinition = await moratoryInterestsReportTemplate(templateData);
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
            this.logger.error('Error generando PDF de reporte de intereses moratorios:', error);
            throw new Error(`Error al generar PDF: ${error.message}`);
        }
    }

    /**
     * Genera reporte de intereses moratorios en Excel
     */
    async generateMoratoryInterestsReportExcel(reportData: any): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Intereses Moratorios');

        const { loansReport } = reportData;
        const { data = [], summary = {}, startDate, endDate } = loansReport || {};

        // 1. ENCABEZADO PRINCIPAL
        worksheet.getCell('A1').value = 'REPORTE DE INTERESES MORATORIOS';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.getCell('A3').value = `Período: ${startDate || 'N/A'} - ${endDate || 'N/A'}`;
        worksheet.getCell('A3').font = { bold: true };

        // 2. RESUMEN GENERAL
        worksheet.getCell('A5').value = 'RESUMEN GENERAL';
        worksheet.getCell('A5').font = { bold: true, size: 14 };

        worksheet.getCell('A6').value = 'Total Intereses Generados:';
        worksheet.getCell('B6').value = summary.totalGenerated || 0;
        worksheet.getCell('B6').numFmt = '$#,##0.00';

        worksheet.getCell('A7').value = 'Total Recaudado (Intereses):';
        worksheet.getCell('B7').value = summary.totalCollected || 0;
        worksheet.getCell('B7').numFmt = '$#,##0.00';

        worksheet.getCell('A8').value = 'Total Descontado:';
        worksheet.getCell('B8').value = summary.totalDiscounted || 0;
        worksheet.getCell('B8').numFmt = '$#,##0.00';

        worksheet.getCell('A9').value = 'Total Pendiente por Recaudar:';
        worksheet.getCell('B9').value = summary.totalRemaining || 0;
        worksheet.getCell('B9').numFmt = '$#,##0.00';

        let currentRow = 11;

        // 3. DETALLE AGRUPADO POR STATUS
        for (const group of data) {
            const { status, records = [], totalGenerated, totalCollected, totalDiscounted, totalRemaining } = group;

            if (!records.length) continue;

            currentRow += 2;
            worksheet.getCell(`A${currentRow}`).value = `ESTADO: ${status.toUpperCase()}`;
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };

            currentRow += 2;

            // Tabla de registros individuales
            worksheet.addTable({
                name: `${status.replace(/\s+/g, '')}Table`,
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'ID Cuota', filterButton: true },
                    { name: 'Estado', filterButton: true },
                    { name: 'Interés Generado', filterButton: true },
                    { name: 'Recaudado', filterButton: true },
                    { name: 'Descontado', filterButton: true },
                    { name: 'Pendiente', filterButton: true },
                    { name: 'Descuentos Aplicados', filterButton: true },
                    { name: 'Fecha' }
                ],
                rows: records.map(r => [
                    r.installmentId,
                    r.status,
                    r.moratoryGenerated || 0,
                    r.moratoryCollected || 0,
                    r.moratoryDiscounted || 0,
                    r.moratoryRemaining || 0,
                    r.discountDescriptions?.join(', ') || '',
                    r.createdAt ? r.createdAt.split('T')[0] : ''
                ])
            });

            currentRow += records.length + 3;

            // Subtotales
            worksheet.getCell(`A${currentRow}`).value = 'Subtotal Generado:';
            worksheet.getCell(`B${currentRow}`).value = totalGenerated || 0;
            worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
            worksheet.getCell(`A${currentRow + 1}`).value = 'Subtotal Recaudado:';
            worksheet.getCell(`B${currentRow + 1}`).value = totalCollected || 0;
            worksheet.getCell(`B${currentRow + 1}`).numFmt = '$#,##0.00';
            worksheet.getCell(`A${currentRow + 2}`).value = 'Subtotal Descontado:';
            worksheet.getCell(`B${currentRow + 2}`).value = totalDiscounted || 0;
            worksheet.getCell(`B${currentRow + 2}`).numFmt = '$#,##0.00';
            worksheet.getCell(`A${currentRow + 3}`).value = 'Subtotal Pendiente:';
            worksheet.getCell(`B${currentRow + 3}`).value = totalRemaining || 0;
            worksheet.getCell(`B${currentRow + 3}`).numFmt = '$#,##0.00';

            currentRow += 5;
        }

        // 4. AJUSTE DE ANCHO AUTOMÁTICO
        worksheet.columns.forEach(col => {
            let maxLength = 10;
            if (typeof col.eachCell === 'function') {
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const text = cell.value ? String(cell.value) : '';
                    maxLength = Math.max(maxLength, text.length + 2);
                });
            }
            col.width = maxLength;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Genera reporte de intereses corrientes recaudados en Excel
     */
    async generateInterestReportExcel(reportData: InterestsReport): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Intereses Corrientes');

        const { data, summary, startDate, endDate } = reportData;

        // 1. ENCABEZADO PRINCIPAL
        worksheet.getCell('A1').value = 'REPORTE DE INTERESES CORRIENTES RECAUDADOS';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.getCell('A3').value = `Período: ${startDate} - ${endDate}`;
        worksheet.getCell('A3').font = { bold: true };

        // 2. RESUMEN GENERAL
        worksheet.getCell('A5').value = 'RESUMEN GENERAL';
        worksheet.getCell('A5').font = { bold: true, size: 14 };

        worksheet.getCell('A6').value = 'Total Interés Recaudado:';
        worksheet.getCell('B6').value = summary.totalInterestCollected;
        worksheet.getCell('B6').numFmt = '$#,##0.00';

        worksheet.getCell('A7').value = 'Total Capital Recaudado:';
        worksheet.getCell('B7').value = summary.totalCapitalCollected;
        worksheet.getCell('B7').numFmt = '$#,##0.00';

        worksheet.getCell('A8').value = 'Total Mora Recaudada:';
        worksheet.getCell('B8').value = summary.totalLateFeeCollected;
        worksheet.getCell('B8').numFmt = '$#,##0.00';

        worksheet.getCell('A9').value = 'Total Pagos Registrados:';
        worksheet.getCell('B9').value = summary.totalPayments;

        let currentRow = 11;

        // 3. DETALLE AGRUPADO POR CLIENTE
        for (const customer of data) {
            if (!customer.records.length) continue;

            currentRow += 2;
            worksheet.getCell(`A${currentRow}`).value = `CLIENTE: ${customer.customerName} (${customer.customerDocument})`;
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };

            currentRow += 2;

            // Tabla de registros individuales
            worksheet.addTable({
                name: `Customer${customer.customerId}Table`,
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'ID Pago', filterButton: true },
                    { name: 'ID Cuota', filterButton: true },
                    { name: 'ID Crédito', filterButton: true },
                    { name: 'Cobrador', filterButton: true },
                    { name: 'Fecha Pago', filterButton: true },
                    { name: 'Interés', filterButton: true },
                    { name: 'Capital', filterButton: true },
                    { name: 'Mora', filterButton: true },
                    { name: 'Total' }
                ],
                rows: customer.records.map(r => [
                    r.paymentId,
                    r.installmentId,
                    r.loanId,
                    r.collectorName,
                    r.paymentDate,
                    r.interestCollected,
                    r.capitalCollected,
                    r.lateFeeCollected,
                    r.totalCollected
                ])
            });

            currentRow += customer.records.length + 3;

            // Subtotales
            worksheet.getCell(`A${currentRow}`).value = 'Subtotal Interés:';
            worksheet.getCell(`B${currentRow}`).value = customer.totalInterestCollected;
            worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';

            worksheet.getCell(`A${currentRow + 1}`).value = 'Subtotal Capital:';
            worksheet.getCell(`B${currentRow + 1}`).value = customer.totalCapitalCollected;
            worksheet.getCell(`B${currentRow + 1}`).numFmt = '$#,##0.00';

            worksheet.getCell(`A${currentRow + 2}`).value = 'Subtotal Mora:';
            worksheet.getCell(`B${currentRow + 2}`).value = customer.totalLateFeeCollected;
            worksheet.getCell(`B${currentRow + 2}`).numFmt = '$#,##0.00';

            worksheet.getCell(`A${currentRow + 3}`).value = 'Subtotal Total:';
            worksheet.getCell(`B${currentRow + 3}`).value = customer.totalCollected;
            worksheet.getCell(`B${currentRow + 3}`).numFmt = '$#,##0.00';

            currentRow += 5;
        }

        // 4. AJUSTE DE ANCHO AUTOMÁTICO
        worksheet.columns.forEach(col => {
            let maxLength = 10;
            if (typeof col.eachCell === 'function') {
                col.eachCell({ includeEmpty: true }, (cell) => {
                    const text = cell.value ? String(cell.value) : '';
                    maxLength = Math.max(maxLength, text.length + 2);
                });
            }
            col.width = maxLength;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Genera reporte de intereses corrientes recaudados en PDF
    */
    async generateInterestReportPdf(reportData: InterestsReport): Promise<Buffer> {
        this.logger.log('Generando reporte de intereses corrientes recaudados en PDF');

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
            // 🔹 Generar texto vertical
            const verticalTextBase64 = await this.getVerticalTextBase64(envs.verticalTextReports, 792);

            // 🔹 Generar gráfica resumen (opcional)
            let summaryChartBase64 = '';
            try {
                if (reportData.summary) {
                    this.logger.log('Generando gráfica de resumen de intereses...');
                    const chartBuffer = await this.generateInterestsSummaryChart(reportData.summary);
                    summaryChartBase64 = `data:image/png;base64,${chartBuffer.toString('base64')}`;
                    this.logger.log('✅ Gráfica de resumen generada correctamente');
                }
            } catch (err) {
                this.logger.warn('❌ Error generando gráfica de resumen de intereses:', err.message);
            }

            // 🔹 Preparar datos para la plantilla
            const templateData = {
                ...reportData,
                reportTitle: 'REPORTE DE INTERESES CORRIENTES RECAUDADOS',
                reportDate: new Date().toLocaleDateString(envs.appLocale),
                headerLogo,
                watermarkLogo,
                verticalTextBase64,
                summaryChartBase64,
            };

            this.logger.log('📄 Generando documento PDF con plantilla de intereses...');

            // 🖨️ Crear definición de documento desde la plantilla
            const docDefinition = await interestsReportTemplate(templateData);

            // 🧾 Crear documento PDF con pdfmake
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

            // 📦 Convertir a Buffer y devolver
            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => {
                    this.logger.log('✅ PDF de intereses generado exitosamente');
                    resolve(Buffer.concat(chunks));
                });
                pdfDoc.on('error', (err) => {
                    pdfDoc.end();
                    this.logger.error('❌ Error al generar PDF de intereses:', err);
                    reject(err);
                });
                pdfDoc.end();
            });
        } catch (error) {
            this.logger.error('Error generando PDF de intereses corrientes:', error);
            throw new Error(`Error al generar PDF de intereses corrientes: ${error.message}`);
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
                                label: function (context) {
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
                                label: function (context) {
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

    async getVerticalTextBase64(text: string, height: number, fontSize: number = 10): Promise<string> {
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
                </svg>`.trim();

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
                                label: function (context) {
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
                                label: function (context) {
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
                                callback: function (value) {
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

    /**
     * Genera un gráfico de resumen simple a partir de los datos proporcionados.
     * @param summary Resumen de los datos a visualizar.
     * @returns Buffer de la imagen del gráfico generado.
     */
    private async generateSimpleSummaryChart(summary: any): Promise<Buffer> {
        try {
            const canvas = createCanvas(400, 300);

            const generated = this.sanitizeNumber(summary.totalGenerated);
            const collected = this.sanitizeNumber(summary.totalCollected);

            const remaining = Math.max(0, generated - collected);
            const labels = ['Generado', 'Recaudado', 'Pendiente'];

            new Chart(canvas as any, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Valores ($)',
                        data: [generated, collected, remaining],
                        backgroundColor: ['#36a2eb', '#4bc0c0', '#ff6384'],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Resumen General',
                            font: { size: 16, weight: 'bold' },
                            color: '#000000'
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#000000' },
                            title: { display: true, text: 'Monto ($)', color: '#000000' }
                        },
                        x: {
                            ticks: { color: '#000000' }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateSimpleSummaryChart:', error);
            return this.createEmptyChart(createCanvas(400, 300), 'Error al generar resumen');
        }
    }

    private async generateInterestsSummaryChart(summary: any): Promise<Buffer> {
        try {
            const canvas = createCanvas(400, 300);

            const interest = this.sanitizeNumber(summary.totalInterestCollected);
            const capital = this.sanitizeNumber(summary.totalCapitalCollected);
            const lateFee = this.sanitizeNumber(summary.totalLateFeeCollected);
            const labels = ['Interés', 'Capital', 'Mora'];

            new Chart(canvas as any, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Monto Recaudado ($)',
                        data: [interest, capital, lateFee],
                        backgroundColor: ['#36a2eb', '#4bc0c0', '#ff6384'],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }],
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Resumen de Recaudación',
                            font: { size: 16, weight: 'bold' },
                            color: '#000000'
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#000000' },
                            title: { display: true, text: 'Monto ($)', color: '#000000' }
                        },
                        x: {
                            ticks: { color: '#000000' }
                        }
                    }
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            this.logger.error('Error en generateInterestsSummaryChart:', error);
            return this.createEmptyChart(createCanvas(400, 300), 'Error al generar resumen');
        }
    }

}
