import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { API_PORT } from './config/env.config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './utils/exception.filter';
import { ResponseFilter } from './utils/response.filter';
import { ValidationExceptionFilter } from '@filters/validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.useGlobalFilters(new HttpExceptionFilter(),new ValidationExceptionFilter());
  // app.useGlobalInterceptors(new ResponseFilter());
  await app.listen(API_PORT || 3000);
}
bootstrap();
