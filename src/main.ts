import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('API documentation for the training application')
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentication endpoints')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, doc);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
