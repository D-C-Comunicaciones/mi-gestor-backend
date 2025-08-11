import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClsModule } from 'nestjs-cls';
import { CollectorsModule } from '@modules/collectors/collectors.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true }, // esto lo instala como middleware global
    }),
    AuthModule,
    CollectorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
