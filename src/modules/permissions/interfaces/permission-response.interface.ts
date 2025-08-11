import { ResponsePermissionDto } from '../dto';

export interface PermissionResponse {
    customMessage: string;
    permission: ResponsePermissionDto;
}

export interface PermissionListResponse {
    customMessage: string;
    permissions: ResponsePermissionDto[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        hasNextPage: boolean;
    };
}