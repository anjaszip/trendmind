import { ConfigService } from '@nestjs/config';
import { ConnectionOptions } from 'bullmq';

export const getBullMQConnection = (configService: ConfigService): ConnectionOptions => ({
  host: configService.get<string>('REDIS_HOST', 'localhost'),
  port: configService.get<number>('REDIS_PORT', 6379),
  password: configService.get<string>('REDIS_PASSWORD'),
  db: configService.get<number>('REDIS_BULLMQ_DB', 1),
});

export const QUEUE_NAMES = {
  TREND_COLLECTION: 'trend-collection',
  ACCELERATION_CALCULATION: 'acceleration-calculation',
  PREDICTION_SCORING: 'prediction-scoring',
  LIFECYCLE_CLASSIFICATION: 'lifecycle-classification',
  INSIGHT_GENERATION: 'insight-generation',
} as const;
