import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Keyword } from './entities/keyword.entity';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';
import { TrendCollectionQueue } from '../jobs/queues/trend-collection.queue';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { AccelerationModule } from '../acceleration/acceleration.module';
import { PredictionModule } from '../prediction/prediction.module';
import { InsightsModule } from '../insights/insights.module';
import { LifecycleModule } from '../lifecycle/lifecycle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Keyword]),
    BullModule.registerQueue({ name: QUEUE_NAMES.TREND_COLLECTION }),
    AccelerationModule,
    PredictionModule,
    InsightsModule,
    LifecycleModule,
  ],
  providers: [KeywordsService, TrendCollectionQueue],
  controllers: [KeywordsController],
  exports: [KeywordsService],
})
export class KeywordsModule {}
