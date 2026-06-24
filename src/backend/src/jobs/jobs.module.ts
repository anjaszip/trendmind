import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { TrendCollectionProcessor } from './trend-collection.processor';
import { AccelerationCalculationProcessor } from './acceleration-calculation.processor';
import { PredictionScoringProcessor } from './prediction-scoring.processor';
import { LifecycleClassificationProcessor } from './lifecycle-classification.processor';
import { InsightGenerationProcessor } from './insight-generation.processor';
import { TrendCollectionQueue } from './queues/trend-collection.queue';
import { AccelerationCalculationQueue } from './queues/acceleration-calculation.queue';
import { PredictionScoringQueue } from './queues/prediction-scoring.queue';
import { LifecycleClassificationQueue } from './queues/lifecycle-classification.queue';
import { InsightGenerationQueue } from './queues/insight-generation.queue';
import { AccelerationModule } from '../acceleration/acceleration.module';
import { PredictionModule } from '../prediction/prediction.module';
import { LifecycleModule } from '../lifecycle/lifecycle.module';
import { InsightsModule } from '../insights/insights.module';
import { GoogleTrendsProvider } from '../providers/signal-providers/google-trends.provider';
import { YouTubeProvider } from '../providers/signal-providers/youtube.provider';
import { SignalAggregationService } from '../providers/signal-providers/signal-aggregation.service';

const ALL_QUEUES = [
  QUEUE_NAMES.TREND_COLLECTION,
  QUEUE_NAMES.ACCELERATION_CALCULATION,
  QUEUE_NAMES.PREDICTION_SCORING,
  QUEUE_NAMES.LIFECYCLE_CLASSIFICATION,
  QUEUE_NAMES.INSIGHT_GENERATION,
].map((name) => ({ name }));

@Module({
  imports: [
    TypeOrmModule.forFeature([TrendDataPoint, Keyword]),
    BullModule.registerQueue(...ALL_QUEUES),
    AccelerationModule,
    PredictionModule,
    LifecycleModule,
    InsightsModule,
  ],
  providers: [
    TrendCollectionProcessor,
    AccelerationCalculationProcessor,
    PredictionScoringProcessor,
    LifecycleClassificationProcessor,
    InsightGenerationProcessor,
    TrendCollectionQueue,
    AccelerationCalculationQueue,
    PredictionScoringQueue,
    LifecycleClassificationQueue,
    InsightGenerationQueue,
    GoogleTrendsProvider,
    YouTubeProvider,
    SignalAggregationService,
  ],
  exports: [
    TrendCollectionQueue,
    AccelerationCalculationQueue,
    PredictionScoringQueue,
    LifecycleClassificationQueue,
    InsightGenerationQueue,
  ],
})
export class JobsModule {}
