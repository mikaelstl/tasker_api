import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { API_PORT } from './config/env.config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './utils/filters/exception.filter';
import { ResponseInterceptor } from './utils/filters/response.filter';
import { ValidationExceptionFilter } from '@filters/validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );
  
  // app.useGlobalInterceptors(new ResponseFilter());
  
  await app.listen(API_PORT || 3000);
}
bootstrap();
