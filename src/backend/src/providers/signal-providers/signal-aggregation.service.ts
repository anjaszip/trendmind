import { Injectable } from '@nestjs/common';
import { NormalizedSignals } from './normalized-signals.interface';

@Injectable()
export class SignalAggregationService {
  merge(signals: NormalizedSignals[]): NormalizedSignals {
    if (signals.length === 0) {
      return this.empty();
    }

    const googleSignals = signals.filter(s => s.provider === 'google_trends');
    const youtubeSignals = signals.filter(s => s.provider === 'youtube');

    const searchVolume = googleSignals[0]?.searchVolume ?? null;
    const videoCount = youtubeSignals[0]?.videoCount ?? null;
    const viewCount = youtubeSignals[0]?.viewCount ?? null;
    const uniqueCreators = youtubeSignals[0]?.uniqueCreators ?? null;
    const engagementRate = youtubeSignals[0]?.engagementRate ?? null;

    const allRelated = signals.flatMap(s => s.relatedQueries);
    const allBreakout = signals.flatMap(s => s.breakoutQueries);
    const relatedQueries = [...new Set(allRelated)];
    const breakoutQueries = [...new Set(allBreakout)];

    const confidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

    return {
      searchVolume,
      videoCount,
      viewCount,
      uniqueCreators,
      engagementRate,
      relatedQueries,
      breakoutQueries,
      confidence,
      collectedAt: new Date(),
      provider: 'aggregated',
    };
  }

  private empty(): NormalizedSignals {
    return {
      searchVolume: null,
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      relatedQueries: [],
      breakoutQueries: [],
      confidence: 0,
      collectedAt: new Date(),
      provider: 'aggregated',
    };
  }
}
