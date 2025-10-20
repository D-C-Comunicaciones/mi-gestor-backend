import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { LoanReportData } from './interfaces';



/**
 * Construye el template del reporte PDF de créditos
 */
export async function loansReportTemplate(
  data: LoanReportData
): Promise<TDocumentDefinitions> {

  return {
    content: [
      // ENCABEZADO
      {
        columns: [
          { width: 100, image: data.headerLogo },
          {
            width: '*',
            text: 'REPORTE DE CRÉDITOS NUEVOS Y REFINANCIADOS',
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
          widths: ['20%', '20%', '20%', '20%', '20%'],
          body: [
            ['Total Créditos', 'Nuevos', 'Refinanciados', 'Monto Total', 'Promedio'].map(t => ({ text: t, style: 'tableHeader' })),
            [
              { text: data.summary.totalLoans.toString(), alignment: 'center' },
              { text: data.summary.numberOfNewLoans.toString(), alignment: 'center', color: '#00aa00', bold: true },
              { text: data.summary.numberOfRefinancedLoans.toString(), alignment: 'center', color: '#ffaa00', bold: true },
              { text: `$${data.summary.totalAmount.toLocaleString()}`, alignment: 'center', bold: true },
              { text: `$${data.summary.averageLoanAmount.toLocaleString()}`, alignment: 'center' },
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
              { text: 'Distribución por Tipo de Crédito', alignment: 'center', fontSize: 8 },
              data.newLoansChartBase64
                ? { image: data.newLoansChartBase64, width: 180, alignment: 'center' }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Comparación: Nuevos vs Refinanciados', alignment: 'center', fontSize: 8 },
              data.comparisonChartBase64
                ? { image: data.comparisonChartBase64, width: 180, alignment: 'center' }
                : { text: 'No disponible', alignment: 'center', fontSize: 8 },
            ],
          },
        ],
      },

      // DETALLE DE CRÉDITOS NUEVOS
      { text: 'CRÉDITOS NUEVOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['8%', '12%', '22%', '12%', '12%', '12%', '12%', '10%'],
          body: [
            ['ID', 'Fecha', 'Cliente', 'Documento', 'Tipo', 'Monto', 'Saldo', 'Interés'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.newLoansDetails.map(loan => [
              { text: loan.id.toString(), fontSize: 7 },
              { text: loan.startDate, fontSize: 7 },
              { text: loan.customerName, fontSize: 7 },
              { text: loan.customerDocument.toString(), fontSize: 7 },
              { text: loan.creditTypeName, fontSize: 7 },
              { text: `$${loan.loanAmount.toLocaleString()}`, fontSize: 7, alignment: 'right', bold: true },
              { text: `$${loan.remainingBalance.toLocaleString()}`, fontSize: 7, alignment: 'right' },
              { text: `${loan.interestRateValue}%`, fontSize: 7, alignment: 'center' },
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // DETALLE DE CRÉDITOS REFINANCIADOS
      { text: 'CRÉDITOS REFINANCIADOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['8%', '12%', '22%', '12%', '12%', '12%', '12%', '10%'],
          body: [
            ['ID', 'Fecha', 'Cliente', 'Documento', 'Tipo', 'Monto', 'Saldo', 'Interés'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.refinancedLoansDetails.map(loan => [
              { text: loan.id.toString(), fontSize: 7 },
              { text: loan.startDate, fontSize: 7 },
              { text: loan.customerName, fontSize: 7 },
              { text: loan.customerDocument.toString(), fontSize: 7 },
              { text: loan.creditTypeName, fontSize: 7 },
              { text: `$${loan.loanAmount.toLocaleString()}`, fontSize: 7, alignment: 'right', bold: true },
              { text: `$${loan.remainingBalance.toLocaleString()}`, fontSize: 7, alignment: 'right' },
              { text: `${loan.interestRateValue}%`, fontSize: 7, alignment: 'center' },
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // RESUMEN DE MONTOS
      { text: 'RESUMEN DE MONTOS', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'CRÉDITOS NUEVOS', fontSize: 10, bold: true, color: '#00aa00', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    ['Cantidad:', data.summary.numberOfNewLoans.toString()],
                    ['Total:', `$${data.summary.newLoansTotalAmount.toLocaleString()}`],
                    ['Promedio:', `$${(data.summary.newLoansTotalAmount / (data.summary.numberOfNewLoans || 1)).toLocaleString()}`],
                  ]
                },
                layout: 'noBorders'
              }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'CRÉDITOS REFINANCIADOS', fontSize: 10, bold: true, color: '#ffaa00', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    ['Cantidad:', data.summary.numberOfRefinancedLoans.toString()],
                    ['Total:', `$${data.summary.refinancedLoansTotalAmount.toLocaleString()}`],
                    ['Promedio:', `$${(data.summary.refinancedLoansTotalAmount / (data.summary.numberOfRefinancedLoans || 1)).toLocaleString()}`],
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

    // FONDO (logo + texto vertical)
    background: (currentPage: number, pageSize: { width: number; height: number }): Content[] => {
      const backgrounds: Content[] = [];

      // Logo de marca de agua
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

      // Texto vertical confidencial
      if (data.verticalTextBase64) {
        backgrounds.push({
          svg: data.verticalTextBase64,
          width: 100,
          height: pageSize.height,
          absolutePosition: {
            x: pageSize.width - 40,
            y: 0
          },
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
      title: 'Reporte de Créditos Nuevos y Refinanciados',
      author: 'Sistema de Gestión de Créditos',
      subject: `Reporte del período ${data.startDate} al ${data.endDate}`,
      creator: 'MiGestor',
      producer: 'MiGestor PDF Generator',
      creationDate: new Date(),
    },
  };
}
