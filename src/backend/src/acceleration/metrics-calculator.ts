import { Injectable } from '@nestjs/common';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';

export interface CalculatedMetrics {
  searchAcceleration: number;
  searchAcceleration7d: number;
  searchAcceleration30d: number;
  videoVelocity: number;
  viewVelocity: number;
  creatorAdoptionRate: number;
  relatedQueryGrowth: number;
  confidenceLevel: ConfidenceLevel;
  historicalDataDays: number;
}

@Injectable()
export class MetricsCalculator {
  calculate(dataPoints: TrendDataPoint[]): CalculatedMetrics {
    if (dataPoints.length < 2) {
      return this.emptyMetrics();
    }

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const oldest = new Date(sorted[0].timestamp);
    const newest = new Date(sorted[sorted.length - 1].timestamp);
    const historicalDataDays = Math.floor(
      (newest.getTime() - oldest.getTime()) / 86_400_000,
    );

    return {
      searchAcceleration: this.calculateSearchAcceleration(sorted),
      searchAcceleration7d: this.calculateSearchAcceleration(this.windowDays(sorted, 7)),
      searchAcceleration30d: this.calculateSearchAcceleration(this.windowDays(sorted, 30)),
      videoVelocity: this.calculateVideoVelocity(sorted, historicalDataDays),
      viewVelocity: this.calculateViewVelocity(sorted, historicalDataDays),
      creatorAdoptionRate: this.calculateCreatorAdoptionRate(sorted, historicalDataDays),
      relatedQueryGrowth: this.calculateRelatedQueryGrowth(sorted),
      confidenceLevel: this.determineConfidenceLevel(historicalDataDays),
      historicalDataDays,
    };
  }

  calculateSearchAcceleration(dataPoints: TrendDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const avgFirst = this.average(firstHalf.map((d) => d.searchVolume ?? 0));
    const avgSecond = this.average(secondHalf.map((d) => d.searchVolume ?? 0));

    if (avgFirst === 0) return 0;
    return (avgSecond - avgFirst) / avgFirst;
  }

  calculateVideoVelocity(dataPoints: TrendDataPoint[], windowDays: number): number {
    if (dataPoints.length < 2 || windowDays <= 0) return 0;
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const first = sorted[0].videoCount ?? 0;
    const last = sorted[sorted.length - 1].videoCount ?? 0;
    const growth = last - first;
    return growth > 0 ? growth / windowDays : 0;
  }

  calculateCreatorAdoptionRate(dataPoints: TrendDataPoint[], windowDays: number): number {
    if (dataPoints.length < 2 || windowDays <= 0) return 0;
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const first = sorted[0].uniqueCreators ?? 0;
    const last = sorted[sorted.length - 1].uniqueCreators ?? 0;
    const growth = last - first;
    return growth > 0 ? growth / windowDays : 0;
  }

  calculateViewVelocity(dataPoints: TrendDataPoint[], windowDays: number): number {
    if (dataPoints.length < 2 || windowDays <= 0) return 0;
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const first = Number(sorted[0].viewCount ?? 0);
    const last = Number(sorted[sorted.length - 1].viewCount ?? 0);
    const growth = last - first;
    return growth > 0 ? growth / windowDays : 0;
  }

  determineConfidenceLevel(historicalDataDays: number): ConfidenceLevel {
    if (historicalDataDays >= 30) return ConfidenceLevel.HIGH;
    if (historicalDataDays >= 14) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  private calculateRelatedQueryGrowth(dataPoints: TrendDataPoint[]): number {
    if (dataPoints.length < 2) return 0;
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const first = sorted[0].relatedQueryBreakouts ?? 0;
    const last = sorted[sorted.length - 1].relatedQueryBreakouts ?? 0;
    if (first === 0) return last > 0 ? 1 : 0;
    return (last - first) / first;
  }

  private windowDays(sorted: TrendDataPoint[], days: number): TrendDataPoint[] {
    const cutoff = new Date(sorted[sorted.length - 1].timestamp);
    cutoff.setDate(cutoff.getDate() - days);
    return sorted.filter((d) => new Date(d.timestamp) >= cutoff);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private emptyMetrics(): CalculatedMetrics {
    return {
      searchAcceleration: 0,
      searchAcceleration7d: 0,
      searchAcceleration30d: 0,
      videoVelocity: 0,
      viewVelocity: 0,
      creatorAdoptionRate: 0,
      relatedQueryGrowth: 0,
      confidenceLevel: ConfidenceLevel.LOW,
      historicalDataDays: 0,
    };
  }
}
