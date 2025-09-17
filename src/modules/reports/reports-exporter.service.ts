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

    async exportReport(reportType: string, format: string, queryParams: any): Promise<Buffer> {
        this.logger.log(`Solicitud de exportación para el reporte "${reportType}" en formato "${format}".`);

        let reportData: ResponseLoanSummaryReportDto;
        try {
            reportData = await this.reportsService.getLoanValuesSummary(queryParams);
        } catch (error) {
            this.logger.error(`Error al obtener los datos del reporte: ${error.message}`);
            throw error;
        }

        switch (format) {
            case 'xlsx':
                return this.generateExcel(reportData, reportType);
            case 'pdf':
                return this.generatePdf(reportData, reportType);
            default:
                throw new BadRequestException(`Formato de exportación "${format}" no soportado.`);
        }
    }

    // ------------------------
    // 📊 Excel con ExcelJS
    // ------------------------
    private async generateExcel(data: ResponseLoanSummaryReportDto, reportType: string): Promise<Buffer> {
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

        // ❌ No se genera ni inserta imagen en Excel

        // Tablas de detalle
        if (data.newLoansDetails?.length) {
            worksheet.addTable({
                name: 'NewLoansTable',
                ref: 'A5',
                headerRow: true,
                columns: [
                    { name: 'ID' },
                    { name: 'Monto' },
                    { name: 'Fecha de Inicio' },
                    { name: 'Estado' },
                ],
                rows: data.newLoansDetails.map(l => [
                    l.id,
                    this.formatCurrency(l.loanAmount),
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
                    { name: 'Monto' },
                    { name: 'Fecha de Inicio' },
                    { name: 'Estado' },
                ],
                rows: data.refinancedLoansDetails.map(l => [
                    l.id,
                    this.formatCurrency(l.loanAmount),
                    l.startDate,
                    l.loanStatusName,
                ]),
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ------------------------
    // 📄 PDF con pdfmake
    // ------------------------
    private getReportDate(): string {
        const now = new Date();
        return now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
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

    private async generatePieChart(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'pie',
            data: {
                labels: ['Créditos Nuevos', 'Créditos Refinanciados'],
                datasets: [{
                    data: [data.numberOfNewLoans || 0, data.numberOfRefinancedLoans || 0],
                    backgroundColor: ['#4bc0c0', '#9966ff'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Distribución de Créditos' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    private async generateTypeBarChart(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        // Gráfica de barras: Nuevos vs Refinanciados
        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels: ['Créditos Nuevos', 'Créditos Refinanciados'],
                datasets: [{
                    label: 'Cantidad',
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
        // Gráfica de barras: Al día vs En Mora (sumando ambos tipos)
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
        // Comparativa: Al día, En Mora, Pagados, Refinanciados
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

    private async generatePdf(data: ResponseLoanSummaryReportDto, reportType: string): Promise<Buffer> {
        // Logo
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

        // Nueva gráfica comparativa de estados
        const statusComparisonBarChartBuffer = await this.generateStatusComparisonBarChart(allLoans);
        const statusComparisonBarChartBase64 = `data:image/png;base64,${statusComparisonBarChartBuffer.toString('base64')}`;

        const fontsPath = process.env.FONTS_PATH || path.resolve(__dirname, '../fonts');
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
                // Portada / Encabezado
                {
                    columns: [
                        logoBase64
                            ? { image: logoBase64, width: 60, alignment: 'left', margin: [0, 0, 0, 0] }
                            : {},
                        { text: 'Resumen de Créditos y Refinanciaciones', style: 'header', alignment: 'center', margin: [0, 10, 0, 0] },
                    ],
                    columnGap: 20,
                },
                { text: `Fecha de corte: ${reportDate}`, alignment: 'right', margin: [0, 0, 0, 10], fontSize: 10 },
                // Gráfica de tipo de crédito
                { text: 'Cantidad de Créditos por Tipo', style: 'subheader', margin: [0, 10, 0, 5] },
                { image: typeBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                this.buildSummaryTable(data),
                // Gráfica de estados (al día vs en mora)
                { text: 'Cantidad de Créditos por Estado (Al día / En Mora)', style: 'subheader', margin: [0, 15, 0, 5] },
                { image: statusBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                // Nueva gráfica comparativa
                { text: 'Comparativa por Estado de Crédito', style: 'subheader', margin: [0, 15, 0, 5] },
                { image: statusComparisonBarChartBase64, width: 220, alignment: 'center', margin: [0, 0, 0, 10] },
                // Detalles de créditos
                { text: 'Detalle de Créditos', style: 'subheader', margin: [0, 15, 0, 5] },
                this.buildCreditsDetailTable(allLoans),
                // Comparativos / Totales Globales
                { text: 'Comparativo Global', style: 'subheader', margin: [0, 15, 0, 5] },
                this.buildGlobalSummaryTable(data),
                this.buildConsolidatedTable(allLoans),
                // Observaciones
                {
                    text: 'Observaciones',
                    style: 'subheader',
                    margin: [0, 20, 0, 5]
                },
                {
                    text: 'Este reporte muestra la distribución y estado de los créditos nuevos y refinanciados. Analice las tendencias para identificar oportunidades y riesgos.',
                    fontSize: 11,
                    italics: true,
                    margin: [0, 0, 0, 10]
                }
            ],
            styles: {
                header: { fontSize: 22, bold: true, color: '#333', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 16, bold: true, color: '#333', margin: [0, 10, 0, 5] },
                totals: { fontSize: 14, margin: [0, 0, 0, 10] },
                chartTitle: { fontSize: 13, bold: true, color: '#555', alignment: 'center' },
                tableHeader: { fillColor: '#4bc0c0', color: '#fff', bold: true, fontSize: 12, alignment: 'center' },
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 11,
            },
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

    private translateStatus(status: string): string {
        switch (status) {
            case 'Up to Date': return 'Al día';
            case 'Overdue': return 'En Mora';
            case 'Refinanced': return 'Refinanciado';
            case 'Paid': return 'Pagado';
            case 'Outstanding Balance': return 'Saldo Pendiente';
            default: return status;
        }
    }

    private buildLoansTable(loans: any[] = []) {
        if (!loans.length) return { text: 'No hay registros', italics: true, margin: [0, 10, 0, 10] };

        return {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', '*'],
                body: [
                    [
                        { text: 'ID', style: 'tableHeader' },
                        { text: 'Monto', style: 'tableHeader' },
                        { text: 'Fecha de Inicio', style: 'tableHeader' },
                        { text: 'Estado', style: 'tableHeader' }
                    ],
                    ...loans.map(l => [
                        l.id,
                        this.formatCurrency(l.loanAmount),
                        l.startDate,
                        this.translateStatus(l.loanStatusName),
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

    private async loadLogoBase64(): Promise<string> {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (!fs.existsSync(logoPath)) return '';
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }

    private async generateChart(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        // Gráfico de montos totales
        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'bar',
            data: {
                labels: ['Créditos Nuevos', 'Créditos Refinanciados'],
                datasets: [
                    {
                        label: 'Monto Total',
                        data: [data.newLoansTotalAmount || 0, data.refinancedLoansTotalAmount || 0],
                        backgroundColor: ['#4bc0c0', '#9966ff'],
                    },
                ],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Montos Totales por Tipo de Crédito' }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    private async generateStatusChart(loans: any[], title: string): Promise<Buffer> {
        // Gráfico de estados de créditos
        const statusCounts: { [key: string]: number } = {};
        loans.forEach(l => {
            const translated = this.translateStatus(l.loanStatusName);
            statusCounts[translated] = (statusCounts[translated] || 0) + 1;
        });
        const labels = Object.keys(statusCounts);
        const dataCounts = Object.values(statusCounts);

        const canvas = createCanvas(400, 300);
        new Chart(canvas as any, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: 'Estados',
                    data: dataCounts,
                    backgroundColor: ['#4bc0c0', '#9966ff', '#ff6384', '#ffcd56'],
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: title }
                }
            }
        });
        return canvas.toBuffer('image/png');
    }

    private formatCurrency(amount: number = 0): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    private formatPrismaDecimal(value: any): number {
        // Convierte el objeto {s, e, d} a número decimal
        if (!value || typeof value !== 'object' || !Array.isArray(value.d)) return value;
        // Ejemplo: { s: 1, e: -2, d: [500000] } => 500000 * 10^-2 = 5000
        const digits = Number(value.d.join(''));
        const exponent = value.e;
        const sign = value.s === -1 ? -1 : 1;
        return sign * digits * Math.pow(10, exponent - (value.d.join('').length - 1));
    }

    private buildCreditsDetailTable(loans: any[] = []) {
        if (!loans.length) return { text: 'No hay registros', italics: true, margin: [0, 10, 0, 10] };
        return {
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                    [
                        { text: 'ID', style: 'tableHeader' },
                        { text: 'Cliente', style: 'tableHeader' },
                        { text: 'Documento', style: 'tableHeader' },
                        { text: 'Monto', style: 'tableHeader' },
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
        // Totales por estado y tipo
        const summary: { [key: string]: { cantidad: number, monto: number } } = {};
        loans.forEach(l => {
            const estado = this.translateStatus(l.loanStatusName);
            const tipo = l.isRefinanced ? 'Refinanciado' : 'Nuevo';
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
}