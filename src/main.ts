import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { API_PORT } from './config/env.config';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { ValidationExceptionFilter } from 'src/common/filters/validation.filter';
import { InternalExceptionFilter } from './common/filters/internal-exception.filter';
import { ValidationException } from './common/errors/validation.exception';

function validationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...validationMessages(error.children ?? []),
  ]);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
    ],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new ValidationException(validationMessages(errors)),
  }));
  
  // O Nest avalia os filters globais na ordem inversa do registro.
  app.useGlobalFilters(
    new InternalExceptionFilter(),
    new BusinessExceptionFilter(),
    new ValidationExceptionFilter(),
  );
  
  // app.useGlobalInterceptors(new ResponseFilter());
  
  const port = Number(API_PORT) || 3000

  await app.listen(port, '0.0.0.0');
}
bootstrap();
