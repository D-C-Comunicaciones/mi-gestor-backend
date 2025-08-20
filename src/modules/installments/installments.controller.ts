import { Controller } from '@nestjs/common';
import { InstallmentsService } from './installments.service';

@Controller('installments')
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

}
