import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccelerationMetrics } from './entities/acceleration-metrics.entity';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { MetricsCalculator } from './metrics-calculator';
import { AccelerationService } from './acceleration.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccelerationMetrics, TrendDataPoint])],
  providers: [MetricsCalculator, AccelerationService],
  exports: [MetricsCalculator, AccelerationService],
})
export class AccelerationModule {}
