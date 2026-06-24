import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { PredictionScore } from '../prediction/entities/prediction-score.entity';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { AIInsight } from '../insights/entities/ai-insight.entity';
import { StageTransitionEvent } from '../lifecycle/entities/stage-transition-event.entity';
import { EmergingOpportunitiesService } from './emerging-opportunities.service';
import { AnalyticsService } from './analytics.service';
import { DashboardController } from './dashboard.controller';
import { CacheModule } from '../common/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Keyword, PredictionScore, AccelerationMetrics, AIInsight, StageTransitionEvent]),
    CacheModule,
  ],
  providers: [EmergingOpportunitiesService, AnalyticsService],
  controllers: [DashboardController],
  exports: [EmergingOpportunitiesService, AnalyticsService],
})
export class DashboardModule {}
