import { Controller, Post, Body, Param, Patch, UploadedFile, ParseIntPipe, UseGuards, Get, Logger } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, ResponseCompanyDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { CompanyListResponse, SwaggerCompanyListResponse, SwaggerCompanyResponse } from './interfaces/company-responses.interface';
import { CompanyResponse } from './interfaces';
import { CreateCompanyDocs, FindAllCompaniesDocs, FindOneCompanyDocs, UpdateCompanyDocs } from '@common/decorators/swagger';

@ApiTags('Companies')
@ApiBearerAuth()
@ApiExtraModels(ResponseCompanyDto, SwaggerCompanyListResponse, SwaggerCompanyResponse)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  private readonly logger = new Logger(CompaniesController.name);

  constructor(private readonly companiesService: CompaniesService) { }

  @Get()
  @Permissions('view.companies')
  @FindAllCompaniesDocs()
  async findAll(): Promise<CompanyListResponse> {
    
    const result = await this.companiesService.findAll();
    
    return {
      customMessage: result.message,
      companies: result.companies
    };
  }

  @Get(':id')
  @Permissions('view.companies')
  @FindOneCompanyDocs()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyResponse> {
    
    const result = await this.companiesService.findOne(id);
    
    return {
      customMessage: result.message,
      company: result.company
    };
  }

  @Post()
  @Permissions('create.companies')
  @CreateCompanyDocs()
  async create(
    @Body() data: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CompanyResponse> {
    
    const result = await this.companiesService.create(data, file);
    
    return {
      customMessage: result.message,
      company: result.company
    };
  }

  @Patch(':id')
  @Permissions('update.companies')
  @UpdateCompanyDocs()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CompanyResponse> {
    
    const result = await this.companiesService.update(id, data, file);
    
    return {
      customMessage: result.message,
      company: result.company
    };
  }
}