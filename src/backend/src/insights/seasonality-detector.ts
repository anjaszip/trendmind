import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';

@Injectable()
export class SeasonalityDetector {
  constructor(
    @InjectRepository(TrendDataPoint)
    private readonly trendRepo: Repository<TrendDataPoint>,
  ) {}

  async detectSeasonalPattern(keywordId: string): Promise<boolean> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const historical = await this.trendRepo
      .createQueryBuilder('dp')
      .where('dp.keywordId = :keywordId', { keywordId })
      .andWhere('dp.timestamp >= :since', { since: oneYearAgo })
      .orderBy('dp.timestamp', 'ASC')
      .getMany();

    if (historical.length < 60) return false;

    return this.hasYearOverYearPattern(historical);
  }

  private hasYearOverYearPattern(points: TrendDataPoint[]): boolean {
    const byMonth = new Map<number, number[]>();
    for (const dp of points) {
      const month = new Date(dp.timestamp).getMonth();
      const volumes = byMonth.get(month) ?? [];
      volumes.push(dp.searchVolume ?? 0);
      byMonth.set(month, volumes);
    }

    if (byMonth.size < 6) return false;

    const monthlyAvgs = Array.from(byMonth.entries()).map(([, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg;
    });

    const mean = monthlyAvgs.reduce((a, b) => a + b, 0) / monthlyAvgs.length;
    if (mean === 0) return false;

    const variance = monthlyAvgs.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / monthlyAvgs.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // CV > 0.3 indicates meaningful seasonal variation
    return coefficientOfVariation > 0.3;
  }
}
