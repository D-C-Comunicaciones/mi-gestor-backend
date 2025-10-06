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
import { collectionsReportTemplate, CollectionReportData } from '../../assets/reports/templates/collections-report.template';
import { envs } from '@config/envs';

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
export class ReportsExporterService {
    private readonly logger = new Logger(ReportsExporterService.name);
    private printer = new PdfPrinter(fonts);

    constructor() { }

    // -----------------------------------------------------------
    // MÉTODOS PRIVADOS PARA PDF
    // -----------------------------------------------------------

    private createPdf(docDefinition: TDocumentDefinitions): PDFKit.PDFDocument {
        return this.printer.createPdfKitDocument(docDefinition);
    }

    private async createPdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const pdfDoc = this.createPdf(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }

    // -----------------------------------------------------------
    // MÉTODOS PARA GENERAR ARCHIVOS DE RECAUDOS
    // -----------------------------------------------------------

    /**
     * Genera reporte de recaudos en PDF usando plantilla
     */
    async generateCollectionReportPdf(reportData: any): Promise<Buffer> {
        try {
            // 🎯 Generar gráficas antes de crear el template
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

            // 🎯 Mapear los datos para que coincidan con la interfaz del template
            const templateData: CollectionReportData = {
                reportDate: new Date().toLocaleDateString(envs.appLocale),
                startDate: reportData.startDate,
                endDate: reportData.endDate,
                headerLogo: this.getLogosBase64().headerLogo,
                watermarkLogo: this.getLogosBase64().watermarkLogo,
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

            const docDefinition = collectionsReportTemplate(templateData);
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);

            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);
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

    // -----------------------------------------------------------
    // MÉTODOS AUXILIARES PARA COLLECTIONS
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
                    labels: ['Rendimiento Actual', 'Por Alcanzar'],
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
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: true,
                            position: 'bottom'
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
                            font: { size: 14, weight: 'bold' }
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function (value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45
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
                            font: { size: 14 }
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1
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
            ctx.fillStyle = '#666666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Gráfica no disponible', 200, 150);
            return emptyCanvas.toBuffer('image/png');
        }
    }

    // -----------------------------------------------------------
    // MÉTODOS AUXILIARES PRIVADOS GENERALES
    // -----------------------------------------------------------

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

    private getReportDate(): string {
        const now = new Date();
        return now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
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

    // -----------------------------------------------------------
    // MÉTODOS PARA OTROS REPORTES (INTERESES Y PRÉSTAMOS)
    // -----------------------------------------------------------

    async generateInterestReportPdf(data: any): Promise<Buffer> {
        this.logger.log('Generando reporte de intereses en PDF');

        const reportDate = this.getReportDate();
        const logoBase64 = await this.getLogosBase64();
        const allDetails = data.details || [];
        const grandTotals = data;

        // Generar Gráficas
        const collectedVsPendingChartBuffer = await this.generateCollectedVsPendingChart(grandTotals);
        const collectedVsPendingChartBase64 = `data:image/png;base64,${collectedVsPendingChartBuffer.toString('base64')}`;

        const conceptChartBuffer = await this.generateInterestByConceptPieChart(grandTotals);
        const conceptChartBase64 = `data:image/png;base64,${conceptChartBuffer.toString('base64')}`;

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
                        {
                            width: '50%',
                            stack: [
                                { text: 'Intereses: Recaudado vs. Pendiente', alignment: 'center', fontSize: 8, margin: [0, 0, 0, 5] },
                                { image: collectedVsPendingChartBase64, width: 180, alignment: 'center' },
                            ]
                        },
                        {
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

        return this.createPdfBuffer(docDefinition);
    }

    /**
     * Genera reporte de préstamos en PDF
     */
    async generateLoansPdf(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        this.logger.log('Generando reporte de préstamos en PDF');

        const logoBase64 = await this.getLogosBase64();
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

        return this.createPdfBuffer(docDefinition);
    }

    // -----------------------------------------------------------
    // MÉTODOS PARA EXCEL
    // -----------------------------------------------------------

    async generateInterestReportExcel(data: any): Promise<Buffer> {
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

    async generateLoansExcel(data: ResponseLoanSummaryReportDto): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resumen Créditos');

        const allLoans = [
            ...(data.newLoansDetails || []),
            ...(data.refinancedLoansDetails || [])
        ];

        // 1. Encabezado
        worksheet.getCell('A1').value = 'RESUMEN DE CRÉDITOS Y REFINANCIACIONES';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.mergeCells('A1:I1');
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Fecha de corte
        worksheet.getCell('A3').value = `Fecha de corte: ${this.getReportDate()}`;
        worksheet.getCell('A3').font = { italic: true, size: 12 };
        worksheet.mergeCells('A3:I3');
        worksheet.getCell('A3').alignment = { horizontal: 'right' };

        // 2. Resumen por Tipo de Crédito
        worksheet.getCell('A5').value = 'RESUMEN POR TIPO DE CRÉDITO';
        worksheet.getCell('A5').font = { bold: true, size: 14 };
        worksheet.getCell('A6').value = 'Tipo de Crédito';
        worksheet.getCell('B6').value = 'Cantidad';
        worksheet.getCell('C6').value = 'Monto Total';
        worksheet.getCell('A6:C6').font = { bold: true };

        const newLoansCount = data.numberOfNewLoans || 0;
        const refinancedLoansCount = data.numberOfRefinancedLoans || 0;
        const newLoansTotalAmount = data.newLoansTotalAmount || 0;
        const refinancedLoansTotalAmount = data.refinancedLoansTotalAmount || 0;

        worksheet.addRow(['Créditos Nuevos', newLoansCount, newLoansTotalAmount]);
        worksheet.addRow(['Créditos Refinanciados', refinancedLoansCount, refinancedLoansTotalAmount]);

        // Totales
        if (worksheet.lastRow) {
            worksheet.getCell(`B${worksheet.lastRow.number + 1}`).value = { formula: `SUM(B6:B${worksheet.lastRow.number})`, result: newLoansCount + refinancedLoansCount };
            worksheet.getCell(`C${worksheet.lastRow.number}`).value = { formula: `SUM(C6:C${worksheet.lastRow.number - 1})`, result: newLoansTotalAmount + refinancedLoansTotalAmount };
            worksheet.getCell(`B${worksheet.lastRow.number + 1}`).font = { bold: true };
            worksheet.getCell(`C${worksheet.lastRow.number}`).font = { bold: true };
        }

        // 3. Detalle de Créditos
        let currentRow = worksheet.lastRow ? worksheet.lastRow.number + 3 : 9;

        if (allLoans.length > 0) {
            worksheet.addTable({
                name: 'CreditsDetailTable',
                ref: `A${currentRow}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium2', showRowStripes: true },
                columns: [
                    { name: 'ID' },
                    { name: 'Cliente' },
                    { name: 'Documento' },
                    { name: 'Monto Prestado' },
                    { name: 'Saldo Restante' },
                    { name: 'Fecha de Inicio' },
                    { name: 'Estado' },
                ],
                rows: allLoans.map(l => [
                    l.id,
                    l.customerName,
                    l.customerDocument,
                    this.formatCurrency(l.loanAmount),
                    this.formatCurrency(l.remainingBalance || 0),
                    l.startDate,
                    this.translateStatus(l.loanStatusName),
                ]),
            });

            // Aplicar formato de moneda y ancho
            worksheet.getTables().forEach(table => {
                [4, 5].forEach(col => worksheet.getColumn(col).numFmt = '$#,##0.00');
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
    // MÉTODOS DE GRÁFICAS Y TABLAS PARA INTERESES Y PRÉSTAMOS
    // -----------------------------------------------------------

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