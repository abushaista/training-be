import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { ValidationPipe } from '@nestjs/common';
import { ElasticLoggingService } from './common/logging/elastic-logging.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  const rabbitmqQueue = process.env.RABBITMQ_QUEUE ?? 'training-app.course.events';

  if (rabbitmqUrl) {
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: rabbitmqQueue,
        noAck: false,
        queueOptions: {
          durable: true,
        },
      },
    });
    await microservice.listen();
  }

  app.use(new CorrelationIdMiddleware().use);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(ElasticLoggingService)));

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
