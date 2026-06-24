import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccelerationMetrics } from './entities/acceleration-metrics.entity';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { MetricsCalculator } from './metrics-calculator';

@Injectable()
export class AccelerationService {
  constructor(
    @InjectRepository(AccelerationMetrics)
    private readonly metricsRepo: Repository<AccelerationMetrics>,
    @InjectRepository(TrendDataPoint)
    private readonly trendRepo: Repository<TrendDataPoint>,
    private readonly calculator: MetricsCalculator,
  ) {}

  async calculateMetrics(keywordId: string): Promise<AccelerationMetrics> {
    const dataPoints = await this.trendRepo.find({
      where: { keywordId },
      order: { timestamp: 'ASC' },
    });

    const calculated = this.calculator.calculate(dataPoints);

    const entity = this.metricsRepo.create({
      keywordId,
      calculationTimestamp: new Date(),
      searchAcceleration: calculated.searchAcceleration,
      searchAcceleration7d: calculated.searchAcceleration7d,
      searchAcceleration30d: calculated.searchAcceleration30d,
      videoVelocity: calculated.videoVelocity,
      viewVelocity: calculated.viewVelocity,
      creatorAdoptionRate: calculated.creatorAdoptionRate,
      relatedQueryGrowth: calculated.relatedQueryGrowth,
      confidenceLevel: calculated.confidenceLevel,
      historicalDataDays: calculated.historicalDataDays,
    });

    return this.metricsRepo.save(entity);
  }

  async getLatestMetrics(keywordId: string): Promise<AccelerationMetrics | null> {
    return this.metricsRepo.findOne({
      where: { keywordId },
      order: { calculationTimestamp: 'DESC' },
    });
  }

  async getAccelerationHistory(keywordId: string, days = 30): Promise<AccelerationMetrics[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.metricsRepo
      .createQueryBuilder('am')
      .where('am.keywordId = :keywordId', { keywordId })
      .andWhere('am.calculationTimestamp >= :since', { since })
      .orderBy('am.calculationTimestamp', 'ASC')
      .getMany();
  }
}
