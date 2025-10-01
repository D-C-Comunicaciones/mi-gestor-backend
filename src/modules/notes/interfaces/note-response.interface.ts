import { ResponseNoteDto } from '../dto';

export interface NoteResponse {
  customMessage: string;
  note: ResponseNoteDto;
}

export interface NoteListResponse {
  customMessage: string;
  notes: ResponseNoteDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
