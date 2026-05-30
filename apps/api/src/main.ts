import 'dotenv/config';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.use(cookieParser());

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    { exclude: ['/'] },
  );
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ZodValidationPipe());

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: { example: 'en' },
    })
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, options));
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
