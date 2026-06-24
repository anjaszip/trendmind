import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { SeasonalityDetector } from './seasonality-detector';
import { InsightGenerator } from './insight-generator';
import { InsightsService } from './insights.service';
import { PredictionModule } from '../prediction/prediction.module';
import { AccelerationModule } from '../acceleration/acceleration.module';
import { CacheModule } from '../common/cache/cache.module';
import { OpenAIProvider } from '../providers/ai-providers/openai.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInsight, TrendDataPoint, Keyword]),
    PredictionModule,
    AccelerationModule,
    CacheModule,
  ],
  providers: [SeasonalityDetector, InsightGenerator, InsightsService, OpenAIProvider],
  exports: [InsightsService],
})
export class InsightsModule {}
