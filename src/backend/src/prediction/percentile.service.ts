import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';

export interface PercentileRanks {
  searchAcceleration: number;
  videoVelocity: number;
  creatorAdoptionRate: number;
  relatedQueryGrowth: number;
  viewVelocity: number;
}

@Injectable()
export class PercentileService {
  constructor(
    @InjectRepository(AccelerationMetrics)
    private readonly metricsRepo: Repository<AccelerationMetrics>,
  ) {}

  async calculatePercentileRanks(keywordId: string): Promise<PercentileRanks> {
    const all = await this.metricsRepo
      .createQueryBuilder('am')
      .select('DISTINCT ON (am.keywordId) am.*')
      .orderBy('am.keywordId')
      .addOrderBy('am.calculationTimestamp', 'DESC')
      .getRawMany<AccelerationMetrics>();

    const target = all.find((m) => m.keywordId === keywordId);
    if (!target) {
      return { searchAcceleration: 0, videoVelocity: 0, creatorAdoptionRate: 0, relatedQueryGrowth: 0, viewVelocity: 0 };
    }

    return {
      searchAcceleration: this.rankOf(Number(target.searchAcceleration), all.map((m) => Number(m.searchAcceleration))),
      videoVelocity: this.rankOf(Number(target.videoVelocity), all.map((m) => Number(m.videoVelocity))),
      creatorAdoptionRate: this.rankOf(Number(target.creatorAdoptionRate), all.map((m) => Number(m.creatorAdoptionRate))),
      relatedQueryGrowth: this.rankOf(Number(target.relatedQueryGrowth), all.map((m) => Number(m.relatedQueryGrowth))),
      viewVelocity: this.rankOf(Number(target.viewVelocity), all.map((m) => Number(m.viewVelocity))),
    };
  }

  calculatePercentileRank(value: number, allValues: number[]): number {
    return this.rankOf(value, allValues);
  }

  private rankOf(value: number, allValues: number[]): number {
    if (allValues.length === 0) return 0;
    const below = allValues.filter((v) => v < value).length;
    return Math.round((below / allValues.length) * 100);
  }
}
