import { IsInt } from 'class-validator';

export class AssignRevokeRoleDto {
  
  @IsInt()
  roleId: number;

}
