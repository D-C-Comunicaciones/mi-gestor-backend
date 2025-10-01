import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { format } from 'date-fns';

export class NoteUserDto {
    @ApiProperty({ example: 1, description: 'ID del usuario' })
    @Expose()
    id: number;

    @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario' })
    @Expose()
    name: string;

    @ApiProperty({ example: 'juan.perez@migestor.com', description: 'Email del usuario' })
    @Expose()
    email: string;
}

export class ResponseNoteDto {
    @ApiProperty({ example: 1, description: 'ID único de la nota' })
    @Expose()
    id: number;

    @ApiProperty({ example: 1, description: 'ID del registro asociado' })
    @Expose()
    modelId: number;

    @ApiProperty({ example: 'loan', description: 'Tipo de modelo asociado' })
    @Expose()
    model: string;

    @ApiProperty({
        example: 'Cliente no se encontraba en casa. Se intentó cobro a las 10:00 AM.',
        description: 'Contenido de la nota'
    })
    @Expose()
    content: string;

    @ApiProperty({ example: 1, description: 'ID del usuario que creó la nota' })
    @Expose()
    createdBy: number;

    @ApiProperty({ example: '2024-01-01 10:00:00' })
    @Expose()
    @Transform(({ value }) => (value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : value), { toPlainOnly: true })
    createdAt: Date;

    @ApiProperty({ description: 'Información del usuario que creó la nota' })
    @Expose()
    @Type(() => NoteUserDto)
    user: NoteUserDto;
}
