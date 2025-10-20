import type { TDocumentDefinitions } from 'pdfmake/interfaces';

export async function moratoryInterestsReportTemplate(data: any): Promise<TDocumentDefinitions> {
  return {
    content: [
      { text: 'REPORTE DE INTERESES MORATORIOS', style: 'header', margin: [0, 0, 0, 10] },
      { text: `Período: ${data.startDate} - ${data.endDate}`, alignment: 'right', fontSize: 9, margin: [0, 0, 0, 10] },

      { text: 'RESUMEN GENERAL', style: 'subheader', margin: [0, 5, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['25%', '20%', '20%', '20%', '15%'],
          body: [
            ['Estado', 'Generado', 'Recaudado', 'Pendiente', 'Descontado'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.totalData.map((r: any) => [
              { text: r.status, alignment: 'center' },
              { text: `$${r.total_generado.toLocaleString()}`, alignment: 'right' },
              { text: `$${r.total_recaudado.toLocaleString()}`, alignment: 'right' },
              { text: `$${r.total_pendiente.toLocaleString()}`, alignment: 'right' },
              { text: `$${r.total_discounted.toLocaleString()}`, alignment: 'right' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines'
      },

      { text: 'RESUMEN POR FECHA', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['15%', '20%', '20%', '20%', '20%'],
          body: [
            ['Fecha', 'Estado', 'Generado', 'Recaudado', 'Pendiente'].map(t => ({ text: t, style: 'tableHeader' })),
            ...data.dailyData.map((r: any) => [
              { text: r.fecha_movimiento, alignment: 'center' },
              { text: r.status, alignment: 'center' },
              { text: `$${r.total_generado.toLocaleString()}`, alignment: 'right' },
              { text: `$${r.total_recaudado.toLocaleString()}`, alignment: 'right' },
              { text: `$${r.total_pendiente.toLocaleString()}`, alignment: 'right' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines'
      },
    ],
    styles: {
      header: { fontSize: 14, bold: true, alignment: 'center' },
      subheader: { fontSize: 11, bold: true, color: '#333' },
      tableHeader: { fillColor: '#4bc0c0', color: '#fff', bold: true, fontSize: 8, alignment: 'center' },
    },
    defaultStyle: { font: 'Helvetica', fontSize: 8 },
  };
}
