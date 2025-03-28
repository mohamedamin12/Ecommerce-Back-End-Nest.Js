import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { I18nValidationPipe } from 'nestjs-i18n';
import helmet from 'helmet';




async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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

  //* CSRF protection
  // const {
  //   doubleCsrfProtection, // This is the default CSRF protection middleware.
  // } = doubleCsrf({
  //   secret: process.env.CSRF_SECRET,
  //   cookie: {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'strict',
  //   },
    
  //   });
  // app.use(doubleCsrfProtection);

  //* helmet HTTP headers
  app.use(helmet());
  //* Cors
  app.enableCors({
    origin: ['https://ecommerce-nestjs.com'],
  });
  app.useGlobalPipes(new I18nValidationPipe());
  app.setGlobalPrefix("api/v1")
  await app.listen(5000);
}
bootstrap();
