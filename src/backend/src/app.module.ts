import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './common/cache/cache.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { AccelerationModule } from './acceleration/acceleration.module';
import { PredictionModule } from './prediction/prediction.module';
import { InsightsModule } from './insights/insights.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JobsModule } from './jobs/jobs.module';
import { KeywordsModule } from './keywords/keywords.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { QUEUE_NAMES, getBullMQConnection } from './common/config/bullmq.config';

// Entities
import { User } from './auth/entities/user.entity';
import { Keyword } from './keywords/entities/keyword.entity';
import { TrendDataPoint } from './trends/entities/trend-data-point.entity';
import { AccelerationMetrics } from './acceleration/entities/acceleration-metrics.entity';
import { PredictionScore } from './prediction/entities/prediction-score.entity';
import { AIInsight } from './insights/entities/ai-insight.entity';
import { StageTransitionEvent } from './lifecycle/entities/stage-transition-event.entity';

// Seed keywords scheduler
import { SeedKeywordsScheduler } from './jobs/schedulers/seed-keywords.scheduler';
import { TrendCollectionQueue } from './jobs/queues/trend-collection.queue';
import { TimescaleSetupService } from './database/timescale-setup.service';

const ALL_ENTITIES = [
  User,
  Keyword,
  TrendDataPoint,
  AccelerationMetrics,
  PredictionScore,
  AIInsight,
  StageTransitionEvent,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'trendmind'),
        entities: ALL_ENTITIES,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getBullMQConnection(configService),
      }),
    }),

    BullModule.registerQueue(
      { name: QUEUE_NAMES.TREND_COLLECTION },
      { name: QUEUE_NAMES.ACCELERATION_CALCULATION },
      { name: QUEUE_NAMES.PREDICTION_SCORING },
      { name: QUEUE_NAMES.LIFECYCLE_CLASSIFICATION },
      { name: QUEUE_NAMES.INSIGHT_GENERATION },
    ),

    TypeOrmModule.forFeature([Keyword]),

    AuthModule,
    CacheModule,
    AccelerationModule,
    PredictionModule,
    LifecycleModule,
    InsightsModule,
    DashboardModule,
    JobsModule,
    KeywordsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TimescaleSetupService,
    TrendCollectionQueue,
    SeedKeywordsScheduler,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
