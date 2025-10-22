import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MoratoryRecordDto {
    @ApiProperty({ description: 'ID de la cuota o abono asociado' })
    @Expose()
    installmentId: number;

    @ApiProperty({ description: 'Estado del interés moratorio (paid, unpaid, discounted, etc.)' })
    @Expose()
    status: string;

    @ApiProperty({ description: 'Valor generado por intereses moratorios' })
    @Expose()
    moratoryGenerated: number;

    @ApiProperty({ description: 'Valor recaudado de intereses moratorios' })
    @Expose()
    moratoryCollected: number;

    @ApiProperty({ description: 'Valor descontado de intereses moratorios' })
    @Expose()
    moratoryDiscounted: number;

    @ApiProperty({ description: 'Valor restante de intereses moratorios' })
    @Expose()
    moratoryRemaining: number;

    @ApiProperty({ description: 'Descripciones o motivos de los descuentos aplicados', type: [String] })
    @Expose()
    discountDescriptions: string[];

    @ApiProperty({ description: 'Fecha de creación o aplicación del registro' })
    @Expose()
    createdAt: string;
}

export class MoratoryStatusGroupDto {
    @ApiProperty({ description: 'Estado general del grupo (paid, unpaid, partially paid, etc.)' })
    @Expose()
    status: string;

    @ApiProperty({ description: 'Listado de registros individuales asociados a este estado', type: [MoratoryRecordDto] })
    @Expose()
    @Type(() => MoratoryRecordDto)
    records: MoratoryRecordDto[];

    @ApiProperty({ description: 'Total generado para este estado' })
    @Expose()
    totalGenerated: number;

    @ApiProperty({ description: 'Total recaudado para este estado' })
    @Expose()
    totalCollected: number;

    @ApiProperty({ description: 'Total descontado para este estado' })
    @Expose()
    totalDiscounted: number;

    @ApiProperty({ description: 'Total restante para este estado' })
    @Expose()
    totalRemaining: number;
}

export class MoratorySummaryDto {
    @ApiProperty({ description: 'Suma total de intereses moratorios generados en el período' })
    @Expose()
    totalGenerated: number;

    @ApiProperty({ description: 'Suma total de intereses moratorios recaudados' })
    @Expose()
    totalCollected: number;

    @ApiProperty({ description: 'Suma total de intereses moratorios descontados' })
    @Expose()
    totalDiscounted: number;

    @ApiProperty({ description: 'Suma total restante de intereses moratorios' })
    @Expose()
    totalRemaining: number;
}

export class ResponseMoratoryInterestReportDto {
    @ApiProperty({ description: 'Fecha de generación del reporte' })
    @Expose()
    generatedAt: string;

    @ApiProperty({ description: 'Fecha de inicio del período del reporte' })
    @Expose()
    startDate: string;

    @ApiProperty({ description: 'Fecha de fin del período del reporte' })
    @Expose()
    endDate: string;

    @ApiProperty({ description: 'Listado agrupado por estado de los intereses moratorios', type: [MoratoryStatusGroupDto] })
    @Expose()
    @Type(() => MoratoryStatusGroupDto)
    data: MoratoryStatusGroupDto[];

    @ApiProperty({ description: 'Resumen general de todos los estados', type: MoratorySummaryDto })
    @Expose()
    @Type(() => MoratorySummaryDto)
    summary: MoratorySummaryDto;
}