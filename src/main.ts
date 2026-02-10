import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Pocket Tesla API')
    .setDescription('API for managing Tesla vehicles, alerts, and user authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and user management')
    .addTag('Vehicles', 'Tesla vehicle operations and commands')
    .addTag('Alerts', 'Alert rules and notifications')
    .addTag('Audit Logs', 'User action audit trail')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
