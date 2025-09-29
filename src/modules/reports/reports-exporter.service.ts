// File: src/modules/reports/reports-exporter.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PdfPrinter from 'pdfmake';
import { join } from 'path';
import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';
import { ReportsService } from './reports.service';
import { ResponseLoanSummaryReportDto } from './dto';
import * as path from 'path';
import * as fs from 'fs';

Chart.register(...registerables);

@Injectable()
export class ReportsExporterService {
    private readonly logger = new Logger(ReportsExporterService.name);

    constructor(private readonly reportsService: ReportsService) { }

    /**
     * Exporta cualquier reporte en el formato solicitado (xlsx, pdf).
     */
    async exportReport(reportType: string, format: string, queryParams: any): Promise<Buffer> {
        this.logger.log(`Solicitud de exportación para el reporte "${reportType}" en formato "${format}".`);

        let reportData: any;
        try {
            switch (reportType) {
                case 'interest-new-loans': 
                case 'interest-summary':
                    // Se llama a la función del servicio con un límite alto para traer todos los datos.
                    reportData = await this.reportsService.getLoanInterestSummary({ ...queryParams, page: 1, limit: 99999999 }); 
                    break;
                case 'loans-summary':
                    reportData = await this.reportsService.getLoanValuesSummary(queryParams);
                    break;
                default:
                    throw new BadRequestException(`Tipo de reporte "${reportType}" no soportado para exportación.`);
            }
        } catch (error) {
            this.logger.error(`Error al obtener los datos del reporte: ${error.message}`);
            throw error;
        }

        const isInterestReport = reportType === 'interest-new-loans' || reportType === 'interest-summary';

        switch (format) {
            case 'xlsx':
                return isInterestReport 
                    ? this.generateInterestReportExcel(reportData, reportType)
                    : this.generateLoansExcel(reportData as ResponseLoanSummaryReportDto, reportType);
            case 'pdf':
                return isInterestReport 
                    ? this.generateInterestReportPdf(reportData, reportType)
                    : this.generateLoansPdf(reportData as ResponseLoanSummaryReportDto, reportType);
            default:
                throw new BadRequestException(`Formato de exportación "${format}" no soportado.`);
        }
    }

    // -----------------------------------------------------------
    // MÉTODOS AUXILIARES GENERALES
    // -----------------------------------------------------------

    private getReportDate(): string {
        const now = new Date();
        return now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    private translateStatus(status: string): string {
        const statusMap = {
            'Up to Date': 'Al día',
            'Overdue': 'En Mora',
            'Refinanced': 'Refinanciado',
            'Paid': 'Pagado',
            'Outstanding Balance': 'Saldo Pendiente',
            'Created': 'Creada',
            'Pending': 'Pendiente'
        };
        return statusMap[status] || status;
    }

    private formatCurrency(amount: number = 0): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    private async loadLogoBase64(): Promise<string> {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (!fs.existsSync(logoPath)) return '';
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }

// -----------------------------------------------------------
    // 💡 REPORTE DE INTERESES - EXCEL (Simplificado)
    // -----------------------------------------------------------
    private async generateInterestReportExcel(data: any, reportType: string): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resumen Intereses');
        
        const allDetails = data.details || [];
        
        // 1. Encabezado y Totales Generales
        worksheet.getCell('A1').value = 'REPORTE DE INTERESES RECAUDADOS Y PENDIENTES';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:H1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Totales Recaudados
        worksheet.getCell('A3').value = '--- Intereses Recaudados (Periodo del Reporte) ---';
        worksheet.getCell('A4').value = 'Total Interés Normal Recaudado:';
        worksheet.getCell('B4').value = data.totalInterestRecaudado || 0;
        worksheet.getCell('B4').numFmt = '$#,##0.00';
        worksheet.getCell('A5').value = 'Total Interés Moratorio Recaudado:';
        worksheet.getCell('B5').value = data.totalMoratorioRecaudado || 0;
        worksheet.getCell('B5').numFmt = '$#,##0.00';
        worksheet.getCell('A6').value = 'TOTAL GENERAL RECAUDADO:';
        worksheet.getCell('B6').value = data.totalGeneralRecaudado || 0;
        worksheet.getCell('B6').font = { bold: true };
        worksheet.getCell('B6').numFmt = '$#,##0.00';
        
        // Totales Pendientes
        worksheet.getCell('D3').value = '--- Intereses Pendientes por Cobrar (Global) ---';
        worksheet.getCell('D4').value = 'Total Interés Normal Pendiente:';
        worksheet.getCell('E4').value = data.totalInterestPendiente || 0;
        worksheet.getCell('E4').numFmt = '$#,##0.00';
        worksheet.getCell('D5').value = 'Total Moratorio Pendiente:';
        worksheet.getCell('E5').value = data.totalMoratorioPendiente || 0;
        worksheet.getCell('E5').numFmt = '$#,##0.00';
        worksheet.getCell('D6').value = 'TOTAL GENERAL PENDIENTE:';
        worksheet.getCell('E6').value = data.totalGeneralPendiente || 0;
        worksheet.getCell('E6').font = { bold: true };
        worksheet.getCell('E6').numFmt = '$#,##0.00';
        
        // 2. Detalle de Pagos
        let currentRow = 9;
        
        if (allDetails.length > 0) {
             worksheet.addTable({
                name: 'DetailPaymentsTable',
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'Fecha Pago', filterButton: true },
                    { name: 'ID Crédito', filterButton: true },
                    { name: 'Cliente', filterButton: true },
                    { name: 'Cobrador' },
                    { name: 'Int. Normal Pagado' },
                    { name: 'Int. Mora Pagado' },
                    { name: 'TOTAL Recaudado' },
                ],
                rows: allDetails.map(l => [
                    l.paymentDate.split(' ')[0],
                    l.loanId,
                    l.customerName,
                    l.collectorName,
                    l.appliedToInterest,
                    l.appliedToLateFee,
                    l.totalPaid,
                ]),
            });

            // Aplicar formato de moneda y ancho
            worksheet.getTables().forEach(table => {
                [5, 6, 7].forEach(col => worksheet.getColumn(col).numFmt = '$#,##0.00');
            });

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
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // -----------------------------------------------------------
    // 📄 GENERACIÓN DE PDF DE INTERESES (Nuevo)
    // -----------------------------------------------------------
    private async generateInterestReportPdf(data: any, reportType: string): Promise<Buffer> {
        const reportDate = this.getReportDate();
        const logoBase64 = await this.loadLogoBase64();
        const allDetails = data.details || []; 
        const grandTotals = data; // Usamos los totales directamente del objeto data

        // Generar Gráficas
        const collectedVsPendingChartBuffer = await this.generateCollectedVsPendingChart(grandTotals); 
        const collectedVsPendingChartBase64 = `data:image/png;base64,${collectedVsPendingChartBuffer.toString('base64')}`;

        const conceptChartBuffer = await this.generateInterestByConceptPieChart(grandTotals); 
        const conceptChartBase64 = `data:image/png;base64,${conceptChartBuffer.toString('base64')}`;

        const fonts = {
            Roboto: {
                normal: join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
                bold: join(process.cwd(), 'public', 'fonts', 'Roboto-Medium.ttf'),
                italics: join(process.cwd(), 'public', 'fonts', 'Roboto-Italic.ttf'),
                bolditalics: join(process.cwd(), 'public', 'fonts', 'Roboto-MediumItalic.ttf'),
            },
        };
        const printer = new PdfPrinter(fonts);

        const docDefinition: any = {
            content: [
                {
                    columns: [
                        logoBase64 ? { image: logoBase64, width: 40, alignment: 'left', margin: [0, 0, 0, 0] } : {},
                        { text: 'REPORTE DE INTERESES RECAUDADOS Y PENDIENTES', style: 'header', alignment: 'center', margin: [0, 10, 0, 0] },
                    ],
                    columnGap: 20,
                },
                { text: `Fecha de reporte: ${reportDate}`, alignment: 'right', margin: [0, 0, 0, 10], fontSize: 8 },
                
                // 1. Resumen de Totales
                { text: '1. Resumen Global de Intereses', style: 'subheader', margin: [0, 10, 0, 5] },
                this.buildGeneralInterestSummaryTable(grandTotals),

                // 2. Gráficas
                { text: '2. Análisis de Intereses Recaudados y Pendientes', style: 'subheader', margin: [0, 15, 0, 5] },
                {
                    columns: [
                        { // Gráfica 1: Monto Recaudado vs. Pendiente
                            width: '50%',
                            stack: [
                                { text: 'Intereses: Recaudado vs. Pendiente', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 5] },
                                { image: collectedVsPendingChartBase64, width: 180, alignment: 'center' },
                            ]
                        },
                        { // Gráfica 2: Normal vs Moratorio
                            width: '50%',
                            stack: [
                                { text: 'Distribución Interés Normal vs. Moratorio (Recaudado)', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 5] },
                                { image: conceptChartBase64, width: 180, alignment: 'center' },
                            ]
                        }
                    ],
                    columnGap: 5,
                    margin: [0, 0, 0, 15]
                },
                
                // 3. Detalle de Pagos
                { text: '3. Detalle de Pagos de Interés en el Periodo', style: 'subheader', margin: [0, 15, 0, 5] },
                this.buildRecaudoDetailTable(allDetails), 
                
                // Observaciones
                {
                    text: 'Observaciones',
                    style: 'subheader',
                    margin: [0, 20, 0, 5]
                },
                {
                    text: 'Este reporte solo incluye el desglose de intereses. El Recaudado se calcula sobre la fecha de pago en el periodo. El Pendiente es la deuda acumulada de intereses (normal y moratorio) de cuotas vencidas/creadas.',
                    fontSize: 8,
                    italics: true,
                    margin: [0, 0, 0, 10]
                }
            ],
            styles: {
                header: { fontSize: 14, bold: true, color: '#333', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, bold: true, color: '#333', margin: [0, 10, 0, 5] },
                tableHeader: { fillColor: '#4bc0c0', color: '#fff', bold: true, fontSize: 8, alignment: 'center' },
                loanHeader: { fontSize: 10, bold: true, color: '#000080', margin: [0, 8, 0, 2] },
                totalRow: { fillColor: '#e0e0e0', bold: true, fontSize: 10 }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 8,
            },
            pageMargins: [20, 20, 20, 20],
        };

        return new Promise((resolve, reject) => {
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }

    // -----------------------------------------------------------
    // MÉTODOS DE TABLAS Y GRÁFICAS (AUXILIARES NUEVOS)
    // -----------------------------------------------------------

    // Tabla de Detalle de Recaudo (Simplificada)
    private buildRecaudoDetailTable(details: any[]) {
        if (!details.length) return { text: 'No hay registros de recaudos en el periodo.', italics: true, margin: [0, 10, 0, 10] };

        return {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
                body: [
                    [
                        { text: 'Fecha Pago', style: 'tableHeader' },
                        { text: 'ID Crédito', style: 'tableHeader' },
                        { text: 'Cliente', style: 'tableHeader' },
                        { text: 'Cobrador', style: 'tableHeader' },
                        { text: 'Int. Normal', style: 'tableHeader' },
                        { text: 'Int. Mora', style: 'tableHeader' },
                        { text: 'TOTAL PAGADO', style: 'tableHeader' },
                    ],
                    ...details.map(l => [
                        l.paymentDate.split(' ')[0],
                        l.loanId,
                        l.customerName,
                        l.collectorName,
                        this.formatCurrency(l.appliedToInterest),
                        this.formatCurrency(l.appliedToLateFee),
                        { text: this.formatCurrency(l.totalPaid), bold: true },
                    ]),
                ],
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10],
        };
    }
    
    // Gráfica de Total Recaudado vs Pendiente
    private async generateCollectedVsPendingChart(data: any): Promise<Buffer> {
        const canvas = createCanvas(400, 300);
        const totalCollected = data.totalGeneralRecaudado || 0;
        const totalPending = data.totalGeneralPendiente || 0;

        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels: ['Interés Recaudado', 'Interés Pendiente'],
                datasets: [{
                    label: 'Monto Total',
                    data: [totalCollected, totalPending],
                    backgroundColor: ['#4bc0c0', '#ff6384'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Intereses: Recaudado vs. Pendiente' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    // Gráfica de Mora vs Saldo (Ahora Desglose de Pendiente)
    private async generateMoraVsSaldoChart(data: any): Promise<Buffer> {
        const canvas = createCanvas(400, 300);
        const totalMora = data.totalMoratorioPendiente || 0;
        const totalNormal = data.totalInterestPendiente || 0; 
        
        new Chart(canvas as any, {
            type: 'pie',
            data: {
                labels: ['Normal Pendiente', 'Moratorio Pendiente'],
                datasets: [{
                    data: [totalNormal, totalMora],
                    backgroundColor: ['#4BC0C0', '#FF6384'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Desglose de la Deuda Pendiente (Intereses)' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    // Gráfica de Desglose de Recaudo (Corriente vs Moratorio)
    private async generateInterestByConceptPieChart(data: any): Promise<Buffer> {
        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'pie',
            data: {
                labels: ['Interés Normal Recaudado', 'Interés Moratorio Recaudado'],
                datasets: [{
                    data: [data.totalInterestRecaudado || 0, data.totalMoratorioRecaudado || 0],
                    backgroundColor: ['#4bc0c0', '#ff6384'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Distribución de Intereses Recaudados por Concepto' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    // -----------------------------------------------------------
    // REPORTE DE PRÉSTAMOS - EXCEL
    // -----------------------------------------------------------
    private async generateLoansExcel(data: ResponseLoanSummaryReportDto, reportType: string): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportType);

        worksheet.getCell('A1').value = 'Resumen de Créditos y Refinanciaciones';
        worksheet.getCell('A1').font = { bold: true, size: 16 };

        worksheet.getCell('A2').value = 'Créditos Nuevos';
        worksheet.getCell('B2').value = data.numberOfNewLoans || 0;
        worksheet.getCell('C2').value = this.formatCurrency(data.newLoansTotalAmount || 0);

        worksheet.getCell('A3').value = 'Créditos Refinanciados';
        worksheet.getCell('B3').value = data.numberOfRefinancedLoans || 0;
        worksheet.getCell('C3').value = this.formatCurrency(data.refinancedLoansTotalAmount || 0);

        // Tablas de detalle
        if (data.newLoansDetails?.length) {
            worksheet.addTable({
                name: 'NewLoansTable',
                ref: 'A5',
                headerRow: true,
                columns: [
                    { name: 'ID' },
                    { name: 'Monto Prestado' }, // ✅ Cambio de nombre para claridad
                    { name: 'Saldo Restante' }, // ✅ Nueva columna
                    { name: 'Fecha de Inicio' },
                    { name: 'Estado' },
                ],
                rows: data.newLoansDetails.map(l => [
                    l.id,
                    this.formatCurrency(l.loanAmount),
                    this.formatCurrency(l.remainingBalance || 0), // ✅ Nueva columna
                    l.startDate,
                    l.loanStatusName,
                ]),
            });
        }

        if (data.refinancedLoansDetails?.length) {
            const startRow = 7 + (data.newLoansDetails?.length || 0);
            worksheet.addTable({
                name: 'RefinancedLoansTable',
                ref: `A${startRow}`,
                headerRow: true,
                columns: [
                    { name: 'ID' },
                    { name: 'Monto Prestado' }, // ✅ Cambio de nombre para claridad
                    { name: 'Saldo Restante' }, // ✅ Nueva columna
                    { name: 'Fecha de Inicio' },
                    { name: 'Estado' },
                ],
                rows: data.refinancedLoansDetails.map(l => [
                    l.id,
                    this.formatCurrency(l.loanAmount),
                    this.formatCurrency(l.remainingBalance || 0), // ✅ Nueva columna
                    l.startDate,
                    l.loanStatusName,
                ]),
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    
    
    // -----------------------------------------------------------
    // GENERACIÓN DE PDF DE PRÉSTAMOS
    // -----------------------------------------------------------
    private async generateLoansPdf(data: ResponseLoanSummaryReportDto, reportType: string): Promise<Buffer> {
        const logoBase64 = await this.loadLogoBase64();
        const reportDate = this.getReportDate();

        const typeBarChartBuffer = await this.generateTypeBarChart(data);
        const typeBarChartBase64 = `data:image/png;base64,${typeBarChartBuffer.toString('base64')}`;

        const allLoans = [
            ...(data.newLoansDetails || []),
            ...(data.refinancedLoansDetails || [])
        ];
        const statusBarChartBuffer = await this.generateStatusBarChart(allLoans);
        const statusBarChartBase64 = `data:image/png;base64,${statusBarChartBuffer.toString('base64')}`;

        const statusComparisonBarChartBuffer = await this.generateStatusComparisonBarChart(allLoans);
        const statusComparisonBarChartBase64 = `data:image/png;base64,${statusComparisonBarChartBuffer.toString('base64')}`;

        const fonts = {
            Roboto: {
                normal: join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'),
                bold: join(process.cwd(), 'public', 'fonts', 'Roboto-Medium.ttf'),
                italics: join(process.cwd(), 'public', 'fonts', 'Roboto-Italic.ttf'),
                bolditalics: join(process.cwd(), 'public', 'fonts', 'Roboto-MediumItalic.ttf'),
            },
        };
        const printer = new PdfPrinter(fonts);

        const docDefinition: any = {
            content: [
                {
                    columns: [
                        logoBase64 ? { image: logoBase64, width: 60, alignment: 'left', margin: [0, 0, 0, 0] } : {},
                        { text: 'Resumen de Créditos y Refinanciaciones', style: 'header', alignment: 'center', margin: [0, 10, 0, 0] },
                    ],
                    columnGap: 20,
                },
                { text: `Fecha de corte: ${reportDate}`, alignment: 'right', margin: [0, 0, 0, 10], fontSize: 10 },
                { text: 'Cantidad de Créditos por Tipo', style: 'subheader', margin: [0, 10, 0, 5] },
                { image: typeBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                this.buildSummaryTable(data),
                { text: 'Cantidad de Créditos por Estado (Al día / En Mora)', style: 'subheader', margin: [0, 15, 0, 5] },
                { image: statusBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                { text: 'Comparativa por Estado de Crédito', style: 'subheader', margin: [0, 15, 0, 5] },
                { image: statusComparisonBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                { text: 'Detalle de Créditos', style: 'subheader', margin: [0, 15, 0, 5] },
                this.buildCreditsDetailTable(allLoans),
                { text: 'Comparativo Global', style: 'subheader', margin: [0, 15, 0, 5] },
                this.buildGlobalSummaryTable(data),
                this.buildConsolidatedTable(allLoans),
                { text: 'Observaciones', style: 'subheader', margin: [0, 20, 0, 5] },
                { text: 'Este reporte muestra la distribución y estado de los créditos nuevos y refinanciados. Analice las tendencias para identificar oportunidades y riesgos.', fontSize: 11, italics: true, margin: [0, 0, 0, 10] }
            ],
            styles: {
                header: { fontSize: 22, bold: true, color: '#333', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 16, bold: true, color: '#333', margin: [0, 10, 0, 5] },
                tableHeader: { fillColor: '#4bc0c0', color: '#fff', bold: true, fontSize: 12, alignment: 'center' },
            },
            defaultStyle: { font: 'Roboto', fontSize: 11 },
            pageMargins: [30, 30, 30, 30],
        };

        return new Promise((resolve, reject) => {
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }

    // -----------------------------------------------------------
    // MÉTODOS DE GRÁFICAS
    // -----------------------------------------------------------

    private async generateTypeBarChart(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels: ['Créditos Nuevos', 'Créditos Refinanciados'],
                datasets: [{
                    label: 'Cantidad créditos por tipo',
                    data: [data.numberOfNewLoans || 0, data.numberOfRefinancedLoans || 0],
                    backgroundColor: ['#4bc0c0', '#9966ff'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Cantidad de Créditos por Tipo' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    private async generateStatusBarChart(loans: any[]): Promise<Buffer> {
        const statusCounts: { [key: string]: number } = {};
        loans.forEach(l => {
            const translated = this.translateStatus(l.loanStatusName);
            if (translated === 'Al día' || translated === 'En Mora') {
                statusCounts[translated] = (statusCounts[translated] || 0) + 1;
            }
        });
        const labels = Object.keys(statusCounts);
        const dataCounts = Object.values(statusCounts);

        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Cantidad',
                    data: dataCounts,
                    backgroundColor: ['#4bc0c0', '#ff6384'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Cantidad de Créditos por Estado' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    private async generateStatusComparisonBarChart(loans: any[]): Promise<Buffer> {
        const statusCounts: { [key: string]: number } = {
            'Al día': 0,
            'En Mora': 0,
            'Pagado': 0,
            'Refinanciado': 0,
        };
        loans.forEach(l => {
            const status = this.translateStatus(l.loanStatusName);
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            }
        });
        const labels = Object.keys(statusCounts);
        const dataCounts = Object.values(statusCounts);

        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Cantidad',
                    data: dataCounts,
                    backgroundColor: ['#4bc0c0', '#ff6384', '#36a2eb', '#9966ff'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Comparativa por Estado de Crédito' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    // -----------------------------------------------------------
    // MÉTODOS DE CONSTRUCCIÓN DE TABLAS
    // -----------------------------------------------------------
    private buildGeneralInterestSummaryTable(data: any) {
        return {
            table: {
                widths: ['*', 'auto', 'auto'],
                body: [
                    [
                        { text: 'CONCEPTO', style: 'tableHeader' },
                        { text: 'TOTAL RECAUDADO (Periodo)', style: 'tableHeader' },
                        { text: 'TOTAL PENDIENTE (Global)', style: 'tableHeader' }
                    ],
                    [
                        { text: 'Interés Corriente', color: '#4bc0c0', bold: true },
                        { text: this.formatCurrency(data.totalInterestRecaudado), alignment: 'right' },
                        { text: this.formatCurrency(data.totalInterestPendiente), alignment: 'right' }
                    ],
                    [
                        { text: 'Interés Moratorio', color: '#ff6384', bold: true },
                        { text: this.formatCurrency(data.totalMoratorioRecaudado), alignment: 'right' },
                        { text: this.formatCurrency(data.totalMoratorioPendiente), alignment: 'right' }
                    ],
                    [
                        { text: 'TOTAL GENERAL INTERESES', bold: true, style: 'totalRow' },
                        { text: this.formatCurrency(data.totalGeneralRecaudado), alignment: 'right', bold: true, style: 'totalRow' },
                        { text: this.formatCurrency(data.totalDeudaPendiente), alignment: 'right', bold: true, style: 'totalRow' }
                    ]
                ]
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex === 3 ? '#e0e0e0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null)),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10]
        };
    }
    
    private buildLoanInstallmentDetails(loans: any[]): any[] {
        const content: any[] = [];

        for (const loan of loans) {
            content.push({ text: `CRÉDITO #${loan.loanId}: ${loan.customerName}`, style: 'loanHeader' });
            content.push({ text: `Estado: ${this.translateStatus(loan.loanStatusName)} | Saldo Pendiente Global: ${this.formatCurrency(loan.remainingBalance)}`, fontSize: 8, margin: [5, 0, 0, 3] });

            const installmentTableBody = [
                [
                    { text: 'Cuota', style: 'tableHeader' },
                    { text: 'Vencimiento', style: 'tableHeader' },
                    { text: 'Total Cuota', style: 'tableHeader' },
                    { text: 'Pagado', style: 'tableHeader' },
                    { text: 'SALDO PENDIENTE', style: 'tableHeader', fillColor: '#FFB84D' },
                    { text: 'Mora Acum.', style: 'tableHeader', fillColor: '#FFB84D' },
                    { text: 'ESTADO/CLASE', style: 'tableHeader', fillColor: '#FFB84D' },
                ]
            ];

            // ✅ Corregir: crear arrays en lugar de objetos para las filas
            const rows = [
                ...loan.installmentStatus.mora.map(inst => [
                    inst.sequence,
                    (inst.dueDate as Date).toISOString().split('T')[0], 
                    this.formatCurrency(inst.totalAmount),
                    this.formatCurrency(inst.paidAmount),
                    this.formatCurrency(inst.saldoPendiente),
                    this.formatCurrency(inst.moratoryAmount),
                    'EN MORA',
                ]),
                ...loan.installmentStatus.pendiente.map(inst => [
                    inst.sequence,
                    (inst.dueDate as Date).toISOString().split('T')[0],
                    this.formatCurrency(inst.totalAmount),
                    this.formatCurrency(inst.paidAmount),
                    this.formatCurrency(inst.saldoPendiente),
                    this.formatCurrency(0),
                    'PENDIENTE PARCIAL',
                ]),
                ...loan.installmentStatus.paid.map(inst => [
                    inst.sequence,
                    (inst.dueDate as Date).toISOString().split('T')[0],
                    this.formatCurrency(inst.totalAmount),
                    this.formatCurrency(inst.paidAmount),
                    this.formatCurrency(0),
                    this.formatCurrency(0),
                    'PAGADA',
                ]),
            ];
            installmentTableBody.push(...rows);

            content.push({
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', '*', '*', 'auto', 'auto', '*'],
                    body: installmentTableBody,
                },
                layout: {
                    fillColor: (rowIndex: number, node: any, columnIndex: number) => {
                        if (rowIndex === 0) return '#4bc0c0';
                        if (node.table.body[rowIndex][6] === 'EN MORA') return '#FFE0E0';
                        if (node.table.body[rowIndex][6] === 'PENDIENTE PARCIAL') return '#FFFFE0';
                        if (node.table.body[rowIndex][6] === 'PAGADA') return '#E6FFE6';
                        return null;
                    },
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#cccccc',
                    vLineColor: () => '#cccccc',
                },
                margin: [5, 2, 0, 5],
            });
            
            // Pagos Recaudados del Periodo
            const paymentsMade = loan.installmentStatus.paid
                .concat(loan.installmentStatus.mora)
                .concat(loan.installmentStatus.pendiente)
                .flatMap(inst => inst.payments || []);

            if (paymentsMade.length > 0) {
                 content.push({ text: 'Pagos Recaudados en el Periodo:', fontSize: 8, margin: [5, 2, 0, 0], bold: true });
                 const paymentsTableBody = [
                     [
                         { text: 'Fecha Pago', style: 'tableHeader', fillColor: '#9999FF' },
                         { text: 'Cobrador', style: 'tableHeader', fillColor: '#9999FF' },
                         { text: 'Int. Normal', style: 'tableHeader', fillColor: '#9999FF' },
                         { text: 'Int. Mora', style: 'tableHeader', fillColor: '#9999FF' },
                         { text: 'Capital', style: 'tableHeader', fillColor: '#9999FF' },
                         { text: 'Total Recaudado', style: 'tableHeader', fillColor: '#9999FF' },
                     ]
                 ];
                 // ✅ Corregir: crear arrays simples para las filas de pagos
                 paymentsTableBody.push(...paymentsMade.map(p => [
                     p.paymentDate.split(' ')[0],
                     p.collectorName,
                     this.formatCurrency(p.appliedToInterest),
                     this.formatCurrency(p.appliedToLateFee),
                     this.formatCurrency(p.appliedToCapital),
                     this.formatCurrency(p.totalPaid),
                 ]));

                 content.push({
                     table: {
                         headerRows: 1,
                         widths: ['auto', '*', '*', '*', '*', '*'],
                         body: paymentsTableBody,
                     },
                     layout: {
                         fillColor: (rowIndex: number) => rowIndex === 0 ? '#6666FF' : (rowIndex % 2 === 0 ? '#f0f0ff' : null),
                     },
                     margin: [10, 0, 0, 8],
                 });
            }
        }
        
        return content;
    }

    private buildSummaryTable(data: ResponseLoanSummaryReportDto) {
        return {
            table: {
                widths: ['*', '*', '*'],
                body: [
                    [
                        { text: 'Tipo', style: 'tableHeader' },
                        { text: 'Cantidad', style: 'tableHeader' },
                        { text: 'Monto Total', style: 'tableHeader' }
                    ],
                    [
                        { text: 'Créditos Nuevos', color: '#4bc0c0', bold: true },
                        { text: data.numberOfNewLoans, alignment: 'center' },
                        { text: this.formatCurrency(data.newLoansTotalAmount), alignment: 'right' }
                    ],
                    [
                        { text: 'Créditos Refinanciados', color: '#9966ff', bold: true },
                        { text: data.numberOfRefinancedLoans, alignment: 'center' },
                        { text: this.formatCurrency(data.refinancedLoansTotalAmount), alignment: 'right' }
                    ]
                ]
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10]
        };
    }

    private buildCreditsDetailTable(loans: any[] = []) {
        if (!loans.length) return { text: 'No hay registros', italics: true, margin: [0, 10, 0, 10] };
        return {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], // ✅ Agregar una columna más
                body: [
                    [
                        { text: 'ID', style: 'tableHeader' },
                        { text: 'Cliente', style: 'tableHeader' },
                        { text: 'Documento', style: 'tableHeader' },
                        { text: 'Monto Prestado', style: 'tableHeader' }, // ✅ Cambio de nombre
                        { text: 'Saldo Restante', style: 'tableHeader' }, // ✅ Nueva columna
                        { text: 'Fecha de Inicio', style: 'tableHeader' },
                        { text: 'Estado', style: 'tableHeader' },
                        { text: 'Tasa Interés (%)', style: 'tableHeader' },
                        { text: 'Tasa Mora (%)', style: 'tableHeader' }
                    ],
                    ...loans.map(l => [
                        l.id,
                        l.customerName || '',
                        l.customerDocument || '',
                        this.formatCurrency(l.loanAmount),
                        this.formatCurrency(l.remainingBalance || 0), // ✅ Nueva columna
                        l.startDate,
                        this.translateStatus(l.loanStatusName),
                        l.interestRateValue ?? '',
                        l.penaltyRateValue ?? ''
                    ]),
                ],
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10],
        };
    }

    private buildConsolidatedTable(loans: any[] = []) {
        const summary: { [key: string]: { cantidad: number, monto: number } } = {};
        loans.forEach(l => {
            const estado = this.translateStatus(l.loanStatusName);
            const tipo = (l.loanStatusName === 'Refinanced' || l.isRefinanced) ? 'Refinanciado' : 'Nuevo'; 
            const key = `${estado} - ${tipo}`;
            if (!summary[key]) summary[key] = { cantidad: 0, monto: 0 };
            summary[key].cantidad += 1;
            summary[key].monto += l.loanAmount || 0;
        });
        const body = [
            [
                { text: 'Estado y Tipo', style: 'tableHeader' },
                { text: 'Cantidad', style: 'tableHeader' },
                { text: 'Monto Total', style: 'tableHeader' }
            ],
            ...Object.entries(summary).map(([key, val]) => [
                key,
                val.cantidad,
                this.formatCurrency(val.monto)
            ])
        ];
        return {
            table: {
                widths: ['*', '*', '*'],
                body
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10]
        };
    }

    private buildGlobalSummaryTable(data: ResponseLoanSummaryReportDto) {
        return {
            table: {
                widths: ['*', '*', '*'],
                body: [
                    [
                        { text: 'Tipo', style: 'tableHeader' },
                        { text: 'Cantidad', style: 'tableHeader' },
                        { text: 'Monto Total', style: 'tableHeader' }
                    ],
                    [
                        { text: 'Créditos Nuevos', color: '#4bc0c0', bold: true },
                        { text: data.numberOfNewLoans, alignment: 'center' },
                        { text: this.formatCurrency(data.newLoansTotalAmount), alignment: 'right' }
                    ],
                    [
                        { text: 'Créditos Refinanciados', color: '#9966ff', bold: true },
                        { text: data.numberOfRefinancedLoans, alignment: 'center' },
                        { text: this.formatCurrency(data.refinancedLoansTotalAmount), alignment: 'right' }
                    ],
                    [
                        { text: 'Total General', bold: true },
                        { text: (data.numberOfNewLoans || 0) + (data.numberOfRefinancedLoans || 0), alignment: 'center', bold: true },
                        { text: this.formatCurrency((data.newLoansTotalAmount || 0) + (data.refinancedLoansTotalAmount || 0)), alignment: 'right', bold: true }
                    ]
                ]
            },
            layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#4bc0c0' : (rowIndex % 2 === 0 ? '#f3f3f3' : null),
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0, 10, 0, 10]
        };
    }
}