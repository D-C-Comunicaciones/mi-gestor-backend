import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GendersService } from './genders.service';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { custom } from 'joi';
import { plainToInstance } from 'class-transformer';
import { GendersListResponse } from './interfaces';
import { ResponseGenderDto } from './dto';

@Controller('genders')
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  // @Post()
  // create(@Body() createGenderDto: CreateGenderDto) {
  //   return this.gendersService.create(createGenderDto);
  // }

  @Get()
  async findAll(): Promise<GendersListResponse> {
    const rawGenders = await this.gendersService.findAll();
    const genders = plainToInstance(
      ResponseGenderDto,
      rawGenders,
      { excludeExtraneousValues: true }
    );

    return {
      customMessage: 'Listado de géneros',
      genders
    };
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gendersService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGenderDto: UpdateGenderDto) {
//     return this.gendersService.update(+id, updateGenderDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gendersService.remove(+id);
//   }
}
