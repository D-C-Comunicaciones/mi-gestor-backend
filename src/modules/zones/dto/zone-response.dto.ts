import { Expose } from "class-transformer";

export class ZoneResponseDto {
  @Expose() id: number;
  @Expose() name: string;
}