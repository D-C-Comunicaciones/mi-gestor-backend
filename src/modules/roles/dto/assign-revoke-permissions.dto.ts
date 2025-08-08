import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class AssignRevokePermissionDto {

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  permissions: number[];

}