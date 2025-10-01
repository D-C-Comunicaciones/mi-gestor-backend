import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClsModule } from 'nestjs-cls';
import { CollectorsModule } from '@modules/collectors/collectors.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ChangesModule } from '@modules/changes/changes.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { LoansModule } from '@modules/loans/loans.module';
import { InstallmentsModule } from '@modules/installments/installments.module';
import { WorkersModule } from '@infraestructure/rabbitmq/workers/loan/workers.module';
import { DiscountsModule } from '@modules/discounts/discounts.module';
import { ImportsModule } from '@modules/imports/imports.module';
import { TemplatesModule } from '@modules/templates/templates.module';
import { TypeDocumentIdentificationsModule } from '@modules/type-document-identifications/type-document-identifications.module';
import { GendersModule } from '@modules/genders/genders.module';
import { ZonesModule } from '@modules/zones/zones.module';
import { LoanTypesModule } from '@modules/loan-types/loan-types.module';
import { PaymentFrequenciesModule } from '@modules/payment-frequencies/payment-frequencies.module';
import { TermsModule } from '@modules/terms/terms.module';
import { InterestRatesModule } from '@modules/interest-rates/interest-rates.module';
import { PenaltyRatesModule } from '@modules/penalty-rates/penalty-rates.module';
import { GracePeriodsModule } from '@modules/grace-periods/grace-periods.module';
import { CollectionsModule } from '@modules/collections/collections.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { ConfigurationsModule } from '@modules/configurations/configurations.module';
import { CompaniesModule } from '@modules/companies/companies.module';
import { AmortizationsModule } from '@modules/amortizations/amortizations.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CollectionRoutesModule } from './modules/collection-routes/collection-routes.module';
import { NotesModule } from './modules/notes/notes.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // esto lo instala como middleware global
    }),
    PrometheusModule.register(),
    AuthModule,
    CollectorsModule,
    CustomersModule,
    ChangesModule,
    LoansModule,
    InstallmentsModule,
    WorkersModule,
    DiscountsModule,
    ImportsModule,
    TemplatesModule,
    TypeDocumentIdentificationsModule,
    GendersModule,
    ZonesModule,
    LoanTypesModule,
    PaymentFrequenciesModule,
    TermsModule,
    InterestRatesModule,
    PenaltyRatesModule,
    GracePeriodsModule,
    CollectionsModule,
    ReportsModule,
    ConfigurationsModule,
    CompaniesModule,
    AmortizationsModule,
    PaymentMethodsModule,
    CollectionRoutesModule,
    NotesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }