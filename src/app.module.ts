import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClsModule } from 'nestjs-cls';
import { CollectorsModule } from '@modules/collectors/collectors.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ChangesModule } from './modules/changes/changes.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { LoansModule } from '@modules/loans/loans.module';
import { InstallmentsModule } from './modules/installments/installments.module';
import { WorkersModule } from '@infraestructure/rabbitmq/workers/loan/workers.module';
import { DiscountsModule } from '@modules/discounts/discounts.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // esto lo instala como middleware global
    }),
    AuthModule,
    CollectorsModule,
    CustomersModule,
    ChangesModule,
    LoansModule,
    InstallmentsModule,
    WorkersModule,
    DiscountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }