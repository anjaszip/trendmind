import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/logger.service';

async function bootstrap() {
  const logger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger });
  app.useGlobalPipes(AppValidationPipe);
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  // T136: request timeout — 5s default, 30s for AI insight routes
  app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    const timeoutMs = req.path.includes('insight') ? 30_000 : 5_000;
    res.setTimeout(timeoutMs, () => {
      res.status(503).json({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Request timed out. Please try again.',
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    });
    next();
  });

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger/OpenAPI Configuration (Principle I - Code Quality)
  const config = new DocumentBuilder()
    .setTitle('TrendMind API')
    .setDescription('AI-Powered Trend Intelligence Platform - REST API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('dashboard', 'Dashboard and opportunities')
    .addTag('keywords', 'Keyword management')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 TrendMind API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
