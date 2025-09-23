import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class TemplatesService {

  getCustomerTemplateFile() {
    const filePath = join(process.cwd(), 'public', 'templates', 'import_customers_template.xlsx');
    console.log(filePath);
    if (!existsSync(filePath)) {
      throw new Error('La plantilla no existe');
    }

    return {
      stream: createReadStream(filePath),
    };
  }

}
