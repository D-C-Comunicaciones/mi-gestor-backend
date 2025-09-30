import type {
  TDocumentDefinitions,
} from 'pdfmake/interfaces';

export interface CollectionReportData {
  reportDate: string;
  startDate: string;
  endDate: string;
  logoBase64: string;
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
    zoneName: string;
    totalAssigned: number;
    totalCollected: number;
    collectionsCount: number;
    performancePercentage: number;
    averageCollectionAmount: number;
  }>;
  collections: Array<{
    paymentDate: string;
    loanId: string;
    customerName: string;
    collectorName: string;
    zoneName: string;
    amount: number;
  }>;
  globalPerformanceChartBase64?: string;
  comparisonChartBase64?: string;
}

// 🔧 Función auxiliar para estilo de rendimiento
function getPerformanceStyle(percentage: number): any {
  if (percentage >= 85) {
    return { color: '#00aa00', bold: true }; // Verde para alto rendimiento
  } else if (percentage >= 70) {
    return { color: '#ffaa00', bold: true }; // Amarillo medio
  } else {
    return { color: '#ff6384', bold: true }; // Rojo bajo
  }
}

export function collectionsReportTemplate(
  data: CollectionReportData,
): TDocumentDefinitions {
  const logoContent = data.logoBase64
    ? { image: data.logoBase64, width: 40, alignment: 'left' as const }
    : { text: '' };

  return {
    content: [
      {
        columns: [
          logoContent,
          {
            text: 'REPORTE DE RECAUDOS POR COBRADOR',
            style: 'header',
            alignment: 'center' as const,
          },
        ],
        columnGap: 20,
      },
      {
        text: `Fecha de reporte: ${data.reportDate}`,
        alignment: 'right',
        margin: [0, 0, 0, 10],
        fontSize: 8,
      },
      {
        text: `Período: ${data.startDate} - ${data.endDate}`,
        alignment: 'center',
        margin: [0, 0, 0, 15],
        fontSize: 10,
      },

      // 📌 Resumen Global
      { text: 'RESUMEN GLOBAL', style: 'subheader', margin: [0, 10, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Total Recaudado', style: 'tableHeader' },
              { text: 'Total Asignado', style: 'tableHeader' },
              { text: 'Rendimiento Global', style: 'tableHeader' },
              { text: 'Cobradores Activos', style: 'tableHeader' },
            ],
            [
              {
                text: `$${data.summary.totalCollected.toLocaleString()}`,
                alignment: 'center',
              },
              {
                text: `$${data.summary.totalAssigned.toLocaleString()}`,
                alignment: 'center',
              },
              {
                text: `${data.summary.globalPerformancePercentage.toFixed(1)}%`,
                alignment: 'center',
                ...getPerformanceStyle(data.summary.globalPerformancePercentage),
              },
              {
                text: data.summary.activeCollectors.toString(),
                alignment: 'center',
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },

      // 📊 Gráficas
      { text: 'ANÁLISIS VISUAL', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Rendimiento Global',
                alignment: 'center',
                fontSize: 8,
              },
              data.globalPerformanceChartBase64
                ? {
                    image: data.globalPerformanceChartBase64,
                    width: 150,
                    alignment: 'center',
                  }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Comparación por Cobrador',
                alignment: 'center',
                fontSize: 8,
              },
              data.comparisonChartBase64
                ? {
                    image: data.comparisonChartBase64,
                    width: 150,
                    alignment: 'center',
                  }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
        ],
      },

      // 👥 Resumen por Cobrador
      {
        text: 'RESUMEN POR COBRADOR',
        style: 'subheader',
        margin: [0, 15, 0, 5],
      },
      {
        table: {
          headerRows: 1,
          widths: ['18%', '14%', '14%', '14%', '14%', '13%', '13%'],
          body: [
            [
              { text: 'Cobrador', style: 'tableHeader' },
              { text: 'Zona', style: 'tableHeader' },
              { text: 'Asignado', style: 'tableHeader' },
              { text: 'Recaudado', style: 'tableHeader' },
              { text: 'Rendimiento', style: 'tableHeader' },
              { text: 'Cobros', style: 'tableHeader' },
              { text: 'Promedio', style: 'tableHeader' },
            ],
            ...data.collectorSummary.map((collector) => [
              { text: collector.collectorName, fontSize: 8 },
              { text: collector.zoneName, fontSize: 8 },
              {
                text: `$${collector.totalAssigned.toLocaleString()}`,
                fontSize: 8,
                alignment: 'right',
              },
              {
                text: `$${collector.totalCollected.toLocaleString()}`,
                fontSize: 8,
                alignment: 'right',
              },
              {
                text: `${collector.performancePercentage.toFixed(1)}%`,
                fontSize: 8,
                alignment: 'center',
                ...getPerformanceStyle(collector.performancePercentage),
              },
              {
                text: collector.collectionsCount.toString(),
                fontSize: 8,
                alignment: 'center',
              },
              {
                text: `$${collector.averageCollectionAmount.toLocaleString()}`,
                fontSize: 8,
                alignment: 'right',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },

      // 💵 Detalle de Recaudos
      {
        text: 'DETALLE DE RECAUDOS',
        style: 'subheader',
        margin: [0, 15, 0, 5],
      },
      {
        table: {
          headerRows: 1,
          widths: ['15%', '10%', '25%', '20%', '15%', '15%'],
          body: [
            [
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Crédito', style: 'tableHeader' },
              { text: 'Cliente', style: 'tableHeader' },
              { text: 'Cobrador', style: 'tableHeader' },
              { text: 'Zona', style: 'tableHeader' },
              { text: 'Monto', style: 'tableHeader' },
            ],
            ...data.collections.slice(0, 50).map((collection) => [
              {
                text: new Date(collection.paymentDate)
                  .toISOString()
                  .split('T')[0],
                fontSize: 8,
              },
              { text: collection.loanId, fontSize: 8 },
              { text: collection.customerName, fontSize: 8 },
              { text: collection.collectorName, fontSize: 8 },
              { text: collection.zoneName, fontSize: 8 },
              {
                text: `$${collection.amount.toLocaleString()}`,
                fontSize: 8,
                alignment: 'right',
              },
            ]),
          ]
        },
        layout: 'lightHorizontalLines',
      },

      // 🌟 Mejores y Peores Cobradores
      { text: 'DESTACADOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'MEJOR COBRADOR',
                fontSize: 10,
                bold: true,
                color: '#00aa00',
                margin: [0, 0, 0, 5],
              },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    ['Nombre:', data.summary.bestCollector.name],
                    [
                      'Rendimiento:',
                      `${data.summary.bestCollector.percentage.toFixed(1)}%`,
                    ],
                    [
                      'Total Recaudado:',
                      `$${data.summary.bestCollector.collected.toLocaleString()}`,
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: 'COBRADOR CON MENOR RENDIMIENTO',
                fontSize: 10,
                bold: true,
                color: '#ff6384',
                margin: [0, 0, 0, 5],
              },
              {
                table: {
                  widths: ['40%', '60%'],
                  body: [
                    ['Nombre:', data.summary.worstCollector.name],
                    [
                      'Rendimiento:',
                      `${data.summary.worstCollector.percentage.toFixed(1)}%`,
                    ],
                    [
                      'Total Recaudado:',
                      `$${data.summary.worstCollector.collected.toLocaleString()}`,
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
        ],
      },
    ],
    styles: {
      header: { fontSize: 14, bold: true, color: '#333' },
      subheader: { fontSize: 12, bold: true, color: '#333' },
      tableHeader: {
        fillColor: '#4bc0c0',
        color: '#fff',
        bold: true,
        fontSize: 8,
        alignment: 'center',
      },
    },
    defaultStyle: { font: 'Helvetica', fontSize: 8 },
    // 📏 MÁRGENES DE DOCUMENTO OFICIAL
    pageMargins: [
      50,  // Izquierdo: 1.77 cm (50 pts)
      60,  // Superior: 2.12 cm (60 pts) 
      40,  // Derecho: 1.41 cm (40 pts)
      50   // Inferior: 1.77 cm (50 pts)
    ],
    pageSize: 'LETTER', // Tamaño carta estándar
    pageOrientation: 'portrait',
    // Configuración de pie de página
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [0, 10, 0, 0]
      };
    },
    // Metadatos del documento
    info: {
      title: 'Reporte de Recaudos por Cobrador',
      author: 'Sistema de Gestión de Créditos',
      subject: `Reporte del período ${data.startDate} al ${data.endDate}`,
      creator: 'MiGestor',
      producer: 'MiGestor PDF Generator',
      creationDate: new Date(),
    }
  };
}
