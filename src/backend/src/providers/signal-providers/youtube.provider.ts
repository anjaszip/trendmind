import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISignalProvider, RateLimitStatus } from './signal-provider.interface';
import { NormalizedSignals } from './normalized-signals.interface';

interface YouTubeRawData {
  videos?: Array<{
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    channel_id?: string;
  }>;
  total_results?: number;
}

@Injectable()
export class YouTubeProvider implements ISignalProvider {
  readonly providerName = 'youtube';
  private readonly logger = new Logger(YouTubeProvider.name);
  private readonly collectorBaseUrl: string;
  private unitsUsedToday = 0;
  private dayResetAt = new Date();

  constructor(private readonly configService: ConfigService) {
    this.collectorBaseUrl = configService.get<string>('TREND_COLLECTOR_URL', 'http://localhost:8000');
    this.resetDayWindow();
  }

  async collectSignals(keyword: string): Promise<NormalizedSignals> {
    this.unitsUsedToday += 100;
    try {
      const response = await fetch(
        `${this.collectorBaseUrl}/collect/youtube?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!response.ok) {
        throw new Error(`Trend collector responded with ${response.status}`);
      }
      const raw = await response.json();
      return this.normalizeSignals(raw);
    } catch (err) {
      this.logger.error(`Failed to collect YouTube signals for "${keyword}": ${err}`);
      return this.emptySignals();
    }
  }

  normalizeSignals(rawData: unknown): NormalizedSignals {
    const data = rawData as YouTubeRawData;
    const videos = data?.videos ?? [];

    const videoCount = data?.total_results ?? videos.length;
    const viewCount = videos.reduce((sum, v) => sum + (v.view_count ?? 0), 0);
    const uniqueCreators = new Set(videos.map(v => v.channel_id).filter(Boolean)).size;
    const totalLikes = videos.reduce((sum, v) => sum + (v.like_count ?? 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.comment_count ?? 0), 0);
    const engagementRate = viewCount > 0
      ? Math.min((totalLikes + totalComments) / viewCount, 0.1)
      : null;

    return {
      searchVolume: null,
      videoCount,
      viewCount,
      uniqueCreators,
      engagementRate,
      relatedQueries: [],
      breakoutQueries: [],
      confidence: videos.length > 0 ? 1 : 0,
      collectedAt: new Date(),
      provider: this.providerName,
    };
  }

  getRateLimitStatus(): RateLimitStatus {
    const now = new Date();
    if (now > this.dayResetAt) {
      this.resetDayWindow();
    }
    const DAILY_QUOTA = 10_000;
    return {
      remaining: Math.max(0, DAILY_QUOTA - this.unitsUsedToday),
      resetAt: this.dayResetAt,
      isLimited: this.unitsUsedToday >= DAILY_QUOTA,
    };
  }

  private resetDayWindow(): void {
    this.unitsUsedToday = 0;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    this.dayResetAt = tomorrow;
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
