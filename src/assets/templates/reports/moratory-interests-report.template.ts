import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

export async function moratoryInterestsReportTemplate(data: any): Promise<TDocumentDefinitions> {
  return {
    background: (currentPage: number, pageSize: { width: number; height: number }): Content[] => {
      const backgrounds: Content[] = [];

      if (data.watermarkLogo) {
        backgrounds.push({
          image: data.watermarkLogo,
          width: 300,
          opacity: 0.08,
          absolutePosition: {
            x: (pageSize.width - 300) / 2,
            y: (pageSize.height - 300) / 2,
          },
        } as any);
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
        });
      }

      return backgrounds;
    },

    content: [
      // ✅ Encabezado alineado a la derecha
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
                    text: 'REPORTE DE INTERESES MORATORIOS',
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

      { text: `Generado el: ${data.reportDate}`, alignment: 'right', fontSize: 9, margin: [0, 5, 0, 10] },
      { text: `Período: ${data.startDate} - ${data.endDate}`, alignment: 'right', fontSize: 9, margin: [0, 0, 0, 10] },

      { text: 'RESUMEN GENERAL', style: 'subheader', margin: [0, 10, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['25%', '20%', '20%', '20%', '15%'],
          body: [
            ['Estado', 'Generado', 'Recaudado', 'Descontado', 'Pendiente'].map((t) => ({
              text: t,
              style: 'tableHeader',
            })),
            ...data.data.map((group: any) => [
              { text: group.status, alignment: 'center' },
              { text: `$${group.totalGenerated.toLocaleString()}`, alignment: 'right' },
              { text: `$${group.totalCollected.toLocaleString()}`, alignment: 'right' },
              { text: `$${group.totalDiscounted.toLocaleString()}`, alignment: 'right' },
              { text: `$${group.totalRemaining.toLocaleString()}`, alignment: 'right' },
            ]),
            [
              { text: 'TOTAL GENERAL', bold: true, alignment: 'center' },
              { text: `$${data.summary.totalGenerated.toLocaleString()}`, bold: true, alignment: 'right' },
              { text: `$${data.summary.totalCollected.toLocaleString()}`, bold: true, alignment: 'right' },
              { text: `$${data.summary.totalDiscounted.toLocaleString()}`, bold: true, alignment: 'right' },
              { text: `$${data.summary.totalRemaining.toLocaleString()}`, bold: true, alignment: 'right' },
            ],
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

      { text: 'DETALLE POR ESTADO', style: 'subheader', margin: [0, 20, 0, 8] },

      ...data.data.map((group: any) => [
        { text: `Estado: ${group.status.toUpperCase()}`, style: 'subheader', margin: [0, 10, 0, 4] },
        {
          table: {
            headerRows: 1,
            widths: ['10%', '15%', '15%', '15%', '15%', '20%', '10%'],
            body: [
              ['ID Cuota', 'Generado', 'Pagado', 'Descontado', 'Pendiente', 'Descripciones', 'Fecha'].map((t) => ({
                text: t,
                style: 'tableHeader',
              })),
              ...group.records.map((r: any) => [
                { text: r.installmentId, alignment: 'center' },
                { text: `$${r.moratoryGenerated.toLocaleString()}`, alignment: 'right' },
                { text: `$${r.moratoryCollected.toLocaleString()}`, alignment: 'right' },
                { text: `$${r.moratoryDiscounted.toLocaleString()}`, alignment: 'right' },
                { text: `$${r.moratoryRemaining.toLocaleString()}`, alignment: 'right' },
                {
                  text: r.discountDescriptions?.length ? r.discountDescriptions.join(', ') : '—',
                  alignment: 'left',
                },
                { text: new Date(r.createdAt).toLocaleDateString(), alignment: 'center' },
              ]),
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
      title: 'Reporte de Intereses Moratorios',
      author: 'Sistema de Gestión de Créditos',
      subject: `Reporte del período ${data.startDate} al ${data.endDate}`,
      creator: 'MiGestor',
      producer: 'MiGestor PDF Generator',
      creationDate: new Date(),
    },
  };
}
