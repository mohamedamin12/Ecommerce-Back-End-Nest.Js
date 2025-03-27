import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { I18nValidationPipe } from 'nestjs-i18n';



async function bootstrap() {
  const app = await NestFactory.create(AppModule , {
    rawBody: true,
    bodyParser: true,
  });

  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    }
  ));
  app.useGlobalPipes(new I18nValidationPipe());
  app.setGlobalPrefix("api/v1")
  await app.listen(5000);
}
bootstrap();
