import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionScore } from './entities/prediction-score.entity';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { PercentileService } from './percentile.service';
import { ScoringService } from './scoring.service';
import { PredictionService } from './prediction.service';
import { AccelerationModule } from '../acceleration/acceleration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionScore, AccelerationMetrics, TrendDataPoint]),
    AccelerationModule,
  ],
  providers: [PercentileService, ScoringService, PredictionService],
  exports: [PercentileService, ScoringService, PredictionService],
})
export class PredictionModule {}
