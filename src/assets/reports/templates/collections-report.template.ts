import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import sharp from 'sharp';

export interface CollectionReportData {
  reportDate: string;
  startDate: string;
  endDate: string;
  headerLogo: string;
  watermarkLogo: string;
  summary: {
    globalPerformancePercentage: number;
    totalAssigned: number;
    totalCollected: number;
    totalCollections: number;
    activeCollectors: number;
    averageCollectedPerCollector: number;
    bestCollector: {
      name: string;
      percentage: number;
      collected: number;
    };
    worstCollector: {
      name: string;
      percentage: number;
      collected: number;
    };
  };
  collectorSummary: Array<{
    collectorName: string;
    collectorRoute: string;
    totalAssigned: number;
    totalCollected: number;
    totalCollectionsMade: number;
    performancePercentage: number;
    averageCollectionAmount: number;
  }>;
  collections: Array<{
    paymentDate: string;
    loanId: string;
    customerName: string;
    collectorName: string;
    collectorRoute: string;
    amount: number;
  }>;
  globalPerformanceChartBase64?: string;
  comparisonChartBase64?: string;
}

function getPerformanceStyle(percentage: number): any {
  if (percentage >= 85) return { color: '#00aa00', bold: true };
  if (percentage >= 70) return { color: '#ffaa00', bold: true };
  return { color: '#ff6384', bold: true };
}

/**
 * Genera un PNG base64 con texto vertical rotado -90°
 * @param text Texto que se mostrará vertical
 * @param height Altura del área disponible en el PDF (ej: pageSize.height - 50)
 * @param fontSize Tamaño de la fuente (default: 10)
 */
export async function getVerticalTextBase64(
  text: string,
  height: number,
  fontSize: number = 10
): Promise<string> {
  const yPos = height - 20;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="${height}">
      <text x="15" y="${yPos}" font-size="${fontSize}" fill="black"
            transform="rotate(-90, 15, ${yPos})">
        ${text}
      </text>
    </svg>
  `;

  const svgBuffer = Buffer.from(svg);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  return 'data:image/png;base64,' + pngBuffer.toString('base64');
}

/**
 * Construye el template del reporte con el texto vertical ya generado
 */
export function collectionsReportTemplate(
  data: CollectionReportData,
  verticalTextBase64?: string
): TDocumentDefinitions {
  return {
    content: [
      // Encabezado
      {
        columns: [
          { width: 100, image: data.headerLogo },
          {
            width: '*',
            text: 'REPORTE DE RECAUDOS POR COBRADOR',
            style: 'header',
            alignment: 'right' as const,
            margin: [0, 15, 0, 0],
          },
        ],
        columnGap: 10,
        margin: [0, 10, 0, 20],
      },
      { text: `Fecha de reporte: ${data.reportDate}`, alignment: 'right', margin: [0, -10, 0, 10], fontSize: 8 },
      { text: `Período: ${data.startDate} - ${data.endDate}`, alignment: 'right', margin: [0, 0, 0, 15], fontSize: 10, bold: true },

      // RESUMEN GLOBAL
      { text: 'RESUMEN GLOBAL', style: 'subheader', margin: [0, 10, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            ['Total Recaudado', 'Total Asignado', 'Rendimiento Global', 'Cobradores Activos'].map(t => ({ text: t, style: 'tableHeader' })),
            [
              { text: `$${data.summary.totalCollected.toLocaleString()}`, alignment: 'center' },
              { text: `$${data.summary.totalAssigned.toLocaleString()}`, alignment: 'center' },
              { text: `${data.summary.globalPerformancePercentage.toFixed(1)}%`, alignment: 'center', ...getPerformanceStyle(data.summary.globalPerformancePercentage) },
              { text: data.summary.activeCollectors.toString(), alignment: 'center' },
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // ANÁLISIS VISUAL
      { text: 'ANÁLISIS VISUAL', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Rendimiento Global', alignment: 'center', fontSize: 8 },
              data.globalPerformanceChartBase64
                ? { image: data.globalPerformanceChartBase64, width: 150, alignment: 'center' }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Comparación por Cobrador', alignment: 'center', fontSize: 8 },
              data.comparisonChartBase64
                ? { image: data.comparisonChartBase64, width: 150, alignment: 'center' }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
        ],
      },

      // RESUMEN POR COBRADOR
      { text: 'RESUMEN POR COBRADOR', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['18%', '14%', '14%', '14%', '14%', '13%', '13%'],
          body: [
            ['Cobrador', 'Ruta', 'Asignado', 'Recaudado', 'Rendimiento', 'Cobros', 'Promedio'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.collectorSummary.map(c => [
              { text: c.collectorName, fontSize: 8 },
              { text: c.collectorRoute, fontSize: 8 },
              { text: `$${c.totalAssigned.toLocaleString()}`, fontSize: 8, alignment: 'right' },
              { text: `$${c.totalCollected.toLocaleString()}`, fontSize: 8, alignment: 'right' },
              { text: `${c.performancePercentage.toFixed(1)}%`, fontSize: 8, alignment: 'center', ...getPerformanceStyle(c.performancePercentage) },
              { text: c.totalCollectionsMade.toString(), fontSize: 8, alignment: 'center' },
              { text: `$${c.averageCollectionAmount.toLocaleString()}`, fontSize: 8, alignment: 'right' },
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // DETALLE DE RECAUDOS
      { text: 'DETALLE DE RECAUDOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['15%', '10%', '25%', '20%', '15%', '15%'],
          body: [
            ['Fecha', 'Crédito', 'Cliente', 'Cobrador', 'Ruta', 'Monto'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.collections.slice(0, 50).map(c => [
              { text: new Date(c.paymentDate).toISOString().split('T')[0], fontSize: 8 },
              { text: c.loanId, fontSize: 8 },
              { text: c.customerName, fontSize: 8 },
              { text: c.collectorName, fontSize: 8 },
              { text: c.collectorRoute, fontSize: 8 },
              { text: `$${c.amount.toLocaleString()}`, fontSize: 8, alignment: 'right' },
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // DESTACADOS
      { text: 'DESTACADOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'MEJOR COBRADOR', fontSize: 10, bold: true, color: '#00aa00', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    ['Nombre:', data.summary.bestCollector.name],
                    ['Rendimiento:', `${data.summary.bestCollector.percentage.toFixed(1)}%`],
                    ['Total Recaudado:', `$${data.summary.bestCollector.collected.toLocaleString()}`],
                  ]
                },
                layout: 'noBorders'
              }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'COBRADOR CON MENOR RENDIMIENTO', fontSize: 10, bold: true, color: '#ff6384', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    ['Nombre:', data.summary.worstCollector.name],
                    ['Rendimiento:', `${data.summary.worstCollector.percentage.toFixed(1)}%`],
                    ['Total Recaudado:', `$${data.summary.worstCollector.collected.toLocaleString()}`],
                  ]
                },
                layout: 'noBorders'
              }
            ]
          }
        ]
      }
    ],

    styles: {
      header: { fontSize: 16, bold: true, color: '#333' },
      subheader: { fontSize: 12, bold: true, color: '#333' },
      tableHeader: { fillColor: '#4bc0c0', color: '#fff', bold: true, fontSize: 8, alignment: 'center' },
    },

    defaultStyle: { font: 'Helvetica', fontSize: 8 },
    pageMargins: [50, 60, 40, 50],
    pageSize: 'LETTER',
    pageOrientation: 'portrait',

    // BACKGROUND: logo + texto vertical ya generado
    background: (currentPage: number, pageSize: { width: number; height: number }): Content[] => {
      const backgrounds: Content[] = [];

      // Logo
      if (data.watermarkLogo) {
        backgrounds.push({
          image: data.watermarkLogo,
          width: 300,
          opacity: 0.08,
          absolutePosition: {
            x: (pageSize.width - 300) / 2,
            y: (pageSize.height - 300) / 2
          }
        } as any);
      }

      // si no viene nada, no dibuja el texto
      if (verticalTextBase64 && verticalTextBase64.startsWith('data:image/png;base64,')) {
  backgrounds.push({
    image: verticalTextBase64,
    fit: [15, pageSize.height - 50],
    absolutePosition: {
      x: pageSize.width - 20,
      y: 25
    }
  });
}

      return backgrounds;
    },

    footer: (currentPage: number, pageCount: number) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#666666',
      margin: [0, 10, 0, 0]
    }),

    info: {
      title: 'Reporte de Recaudos por Cobrador',
      author: 'Sistema de Gestión de Créditos',
      subject: `Reporte del período ${data.startDate} al ${data.endDate}`,
      creator: 'MiGestor',
      producer: 'MiGestor PDF Generator',
      creationDate: new Date(),
    },
  };
}
