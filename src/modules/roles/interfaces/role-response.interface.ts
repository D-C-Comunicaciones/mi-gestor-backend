import { ResponsePermissionDto } from '@permissions/dto';
import { ResponseRoleDto } from '../dto';

export interface RoleResponse {
    customMessage: string;
    role: ResponseRoleDto;
}

export interface RolesListResponse {
    customMessage: string;
    roles: ResponseRoleDto[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        hasNextPage: boolean;
    };
}

export interface UpdatedRoleResponse {
    customMessage: string;
    role: ResponseRoleDto;
}

export interface AssignedOrRevokedPermissionsResponse {
    customMessage: string;
    assignedPermissions?: ResponsePermissionDto[];
    revokedPermissions?: ResponsePermissionDto[];
}