import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from frontend/assets
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'assets'), {
    prefix: '/assets',
  });
  
  // Serve entire frontend directory (for HTML, CSS, JS)
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend'));

  // Increase payload limits to allow base64 image uploads from admin UI
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS (broaden for local development)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests from localhost, 127.0.0.1, file-based origins (null), and common dev ports
      if (!origin) {
        // Same-origin or non-browser requests
        return callback(null, true);
      }
      const allowed = [/^http:\/\/localhost(:\d+)?$/i, /^http:\/\/127\.0\.0\.1(:\d+)?$/i];
      if (allowed.some((re) => re.test(origin))) {
        return callback(null, true);
      }
      // Allow file:// origin (appears as "null")
      if (origin === 'null') {
        return callback(null, true);
      }
      return callback(null, true); // Relaxed CORS for dev; tighten in production
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    // Allow non-whitelisted properties for now so dynamic `specs` objects
    // from the frontend won't cause a 400. We will tighten this later.
    forbidNonWhitelisted: false,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Capstone1 API')
    .setDescription('API cho hệ thống quản lý bán vật tư')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
