import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISignalProvider, RateLimitStatus } from './signal-provider.interface';
import { NormalizedSignals } from './normalized-signals.interface';

interface GoogleTrendsRawData {
  interestOverTime?: { timelineData?: Array<{ value?: number[] }> };
  relatedQueries?: { default?: { rankedList?: Array<{ rankedKeyword?: Array<{ query: string; type?: string }> }> } };
}

@Injectable()
export class GoogleTrendsProvider implements ISignalProvider {
  readonly providerName = 'google_trends';
  private readonly logger = new Logger(GoogleTrendsProvider.name);
  private readonly collectorBaseUrl: string;
  private requestsThisHour = 0;
  private hourResetAt = new Date();

  constructor(private readonly configService: ConfigService) {
    this.collectorBaseUrl = configService.get<string>('TREND_COLLECTOR_URL', 'http://localhost:8000');
    this.resetHourWindow();
  }

  async collectSignals(keyword: string): Promise<NormalizedSignals> {
    this.requestsThisHour++;
    try {
      const response = await fetch(
        `${this.collectorBaseUrl}/collect/google-trends?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!response.ok) {
        throw new Error(`Trend collector responded with ${response.status}`);
      }
      const raw = await response.json();
      return this.normalizeSignals(raw);
    } catch (err) {
      this.logger.error(`Failed to collect Google Trends signals for "${keyword}": ${err}`);
      return this.emptySignals();
    }
  }

  normalizeSignals(rawData: unknown): NormalizedSignals {
    const data = rawData as GoogleTrendsRawData;
    const timeline = data?.interestOverTime?.timelineData ?? [];
    const searchVolume = timeline.length > 0
      ? (timeline[timeline.length - 1]?.value?.[0] ?? null)
      : null;

    const relatedLists = data?.relatedQueries?.default?.rankedList ?? [];
    const allRelated = relatedLists.flatMap(l => l.rankedKeyword ?? []);
    const relatedQueries = allRelated.map(q => q.query);
    const breakoutQueries = allRelated
      .filter(q => q.type === 'breakout')
      .map(q => q.query);

    return {
      searchVolume,
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      relatedQueries,
      breakoutQueries,
      confidence: timeline.length > 0 ? 1 : 0,
      collectedAt: new Date(),
      provider: this.providerName,
    };
  }

  getRateLimitStatus(): RateLimitStatus {
    const now = new Date();
    if (now > this.hourResetAt) {
      this.resetHourWindow();
    }
    const MAX_PER_HOUR = 20;
    return {
      remaining: Math.max(0, MAX_PER_HOUR - this.requestsThisHour),
      resetAt: this.hourResetAt,
      isLimited: this.requestsThisHour >= MAX_PER_HOUR,
    };
  }

  private resetHourWindow(): void {
    this.requestsThisHour = 0;
    this.hourResetAt = new Date(Date.now() + 3_600_000);
  }

  private emptySignals(): NormalizedSignals {
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
      provider: this.providerName,
    };
  }
}
