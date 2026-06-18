# Provider Interfaces Contract: TrendMind Trend Prediction Platform

**Purpose**: Define provider abstractions for pluggable architecture (Constitution Principle V)

**Version**: 2.0.0 (Updated for Trend Prediction)

**Last Updated**: 2026-06-08

## Overview

TrendMind uses the Strategy Pattern to ensure signal providers, AI providers, and notification channels are pluggable and replaceable without modifying core business logic. This version extends provider interfaces to support acceleration metrics, lifecycle classification, and prediction scoring.

---

## Signal Provider Interface

Signal providers collect trend signals from external sources (Google Trends, YouTube, future: TikTok, Reddit, Instagram, marketplaces).

### Interface Definition (TypeScript)

```typescript
export interface ISignalProvider {
  /**
   * Provider identification
   */
  getName(): string;
  getSource(): DataSource; // 'google_trends' | 'youtube' | etc.
  
  /**
   * Capability checks
   */
  supportsKeyword(keyword: string): boolean;
  isAvailable(): Promise<boolean>;
  
  /**
   * Trend signal collection (raw data)
   */
  collectSignals(keyword: string, options?: CollectionOptions): Promise<RawSignalData>;
  
  /**
   * Signal normalization (converts provider-specific data to common format)
   */
  normalizeSignals(raw: RawSignalData): NormalizedSignals;
  
  /**
   * Rate limit management
   */
  getRateLimitStatus(): RateLimitStatus;
  estimateNextAvailableTime(): Date;
}

export interface CollectionOptions {
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  geo?: string; // ISO country code (default: 'US')
  category?: number; // Google Trends category ID
  historicalDays?: number; // Days of historical data to collect (default: 7)
}

/**
 * Raw signal data from provider (provider-specific format)
 */
export interface RawSignalData {
  success: boolean;
  keyword: string;
  source: DataSource;
  timestamp: Date;
  rawData: any; // Provider-specific response format
  error?: string;
}

/**
 * Normalized signals (common format across all providers)
 * Enables unified prediction scoring
 */
export interface NormalizedSignals {
  timestamp: Date;
  source: DataSource;
  
  // Core metrics
  searchVolume: number | null;        // Normalized 0-100 scale
  videoCount: number | null;          // Absolute count
  viewCount: number | null;           // Absolute views
  uniqueCreators: number | null;      // Unique channel/creator count
  engagementRate: number | null;      // Normalized 0-1 scale
  
  // Acceleration signals (calculated from historical comparison)
  searchAcceleration?: number;        // Percentage change (calculated externally)
  videoVelocity?: number;             // Videos/day (calculated externally)
  viewVelocity?: number;              // View growth rate (calculated externally)
  creatorAdoptionRate?: number;       // New creators/day (calculated externally)
  
  // Related queries (Google Trends specific)
  relatedQueries?: string[];
  breakoutQueries?: string[];         // Queries with "breakout" growth
  
  // Data quality
  confidence: number;                 // 0-1 data quality score
  dataCompleteness: number;           // 0-1 percentage of expected fields present
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isExhausted: boolean;
  quotaType: string; // 'hourly' | 'daily' | 'monthly'
}

export enum DataSource {
  GOOGLE_TRENDS = 'google_trends',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',       // Future
  REDDIT = 'reddit',       // Future
  INSTAGRAM = 'instagram', // Future
  AMAZON = 'amazon',       // Future
  ETSY = 'etsy',          // Future
}
```

### Example Implementation: Google Trends Provider

```typescript
@Injectable()
export class GoogleTrendsProvider implements ISignalProvider {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  getName(): string {
    return 'Google Trends (pytrends)';
  }

  getSource(): DataSource {
    return DataSource.GOOGLE_TRENDS;
  }

  supportsKeyword(keyword: string): boolean {
    return keyword.length > 0 && keyword.length <= 100;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.httpService.axiosRef.get(
        `${this.config.get('TREND_COLLECTOR_URL')}/health`,
        { timeout: 2000 }
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async collectSignals(
    keyword: string,
    options?: CollectionOptions
  ): Promise<RawSignalData> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.config.get('TREND_COLLECTOR_URL')}/collect/google-trends`,
        {
          keyword,
          timeframe: options?.timeRange || 'week',
          geo: options?.geo || 'US',
          include_related: true,
        }
      );

      return {
        success: true,
        keyword,
        source: DataSource.GOOGLE_TRENDS,
        timestamp: new Date(),
        rawData: response.data,
      };
    } catch (error) {
      return {
        success: false,
        keyword,
        source: DataSource.GOOGLE_TRENDS,
        timestamp: new Date(),
        rawData: {},
        error: error.message,
      };
    }
  }

  normalizeSignals(raw: RawSignalData): NormalizedSignals {
    if (!raw.success || !raw.rawData) {
      return this.getEmptySignals(raw.timestamp);
    }

    const data = raw.rawData;
    const latestValue = data.interest_over_time?.[0]?.value || 0;
    
    // Count breakout queries
    const breakoutQueries = (data.related_queries?.rising || [])
      .filter(q => q.query_type === 'breakout')
      .map(q => q.query);
    
    const relatedQueries = (data.related_queries?.top || [])
      .map(q => q.query);
    
    return {
      timestamp: raw.timestamp,
      source: DataSource.GOOGLE_TRENDS,
      
      // Google Trends provides 0-100 relative search volume (already normalized)
      searchVolume: latestValue,
      
      // Google Trends doesn't provide these (YouTube does)
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      
      // Related queries
      relatedQueries,
      breakoutQueries,
      
      // Data quality
      confidence: data.interest_over_time?.length > 0 ? 0.9 : 0.3,
      dataCompleteness: 0.5, // Only provides search volume, not engagement
    };
  }

  getRateLimitStatus(): RateLimitStatus {
    // Google Trends unofficial API: ~20 requests/hour
    // Track in Redis with sliding window
    return {
      remaining: 15,
      resetAt: new Date(Date.now() + 3600000),
      isExhausted: false,
      quotaType: 'hourly',
    };
  }

  estimateNextAvailableTime(): Date {
    const status = this.getRateLimitStatus();
    return status.isExhausted ? status.resetAt : new Date();
  }

  private getEmptySignals(timestamp: Date): NormalizedSignals {
    return {
      timestamp,
      source: DataSource.GOOGLE_TRENDS,
      searchVolume: null,
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      relatedQueries: [],
      breakoutQueries: [],
      confidence: 0,
      dataCompleteness: 0,
    };
  }
}
```

### Example Implementation: YouTube Provider

```typescript
@Injectable()
export class YouTubeProvider implements ISignalProvider {
  getName(): string {
    return 'YouTube Data API v3';
  }

  getSource(): DataSource {
    return DataSource.YOUTUBE;
  }

  async collectSignals(keyword: string): Promise<RawSignalData> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.config.get('TREND_COLLECTOR_URL')}/collect/youtube`,
        {
          keyword,
          max_results: 50, // Top 50 videos
          order: 'relevance',
        }
      );

      return {
        success: true,
        keyword,
        source: DataSource.YOUTUBE,
        timestamp: new Date(),
        rawData: response.data,
      };
    } catch (error) {
      return {
        success: false,
        keyword,
        source: DataSource.YOUTUBE,
        timestamp: new Date(),
        rawData: {},
        error: error.message,
      };
    }
  }

  normalizeSignals(raw: RawSignalData): NormalizedSignals {
    if (!raw.success || !raw.rawData?.videos) {
      return this.getEmptySignals(raw.timestamp);
    }

    const videos = raw.rawData.videos;
    
    // Aggregate metrics across top videos
    const videoCount = videos.length;
    const viewCount = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
    const likeCount = videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
    const commentCount = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0);
    
    // Count unique creators (channel IDs)
    const uniqueCreators = new Set(videos.map(v => v.channel_id)).size;
    
    // Engagement rate: (likes + comments) / views, capped at 0.1 (10%)
    const engagementRate = viewCount > 0 
      ? Math.min(0.1, (likeCount + commentCount) / viewCount)
      : 0;
    
    // Normalize search volume (no direct equivalent, use video count percentile)
    // For MVP, we'll rely on Google Trends for search volume
    const searchVolume = null;
    
    return {
      timestamp: raw.timestamp,
      source: DataSource.YOUTUBE,
      
      searchVolume,
      videoCount,
      viewCount,
      uniqueCreators,
      engagementRate,
      
      relatedQueries: null,
      breakoutQueries: null,
      
      confidence: videoCount > 10 ? 0.9 : 0.5,
      dataCompleteness: 0.8, // Provides engagement but not search volume
    };
  }

  getRateLimitStatus(): RateLimitStatus {
    // YouTube API: 10,000 quota units/day
    // Search costs ~100 units per request
    // Max ~100 keywords/day at 100 units each
    return {
      remaining: 5000,
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
      isExhausted: false,
      quotaType: 'daily',
    };
  }

  estimateNextAvailableTime(): Date {
    const status = this.getRateLimitStatus();
    return status.isExhausted ? status.resetAt : new Date();
  }

  private getEmptySignals(timestamp: Date): NormalizedSignals {
    return {
      timestamp,
      source: DataSource.YOUTUBE,
      searchVolume: null,
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      confidence: 0,
      dataCompleteness: 0,
    };
  }
}
```

---

## AI Provider Interface

AI providers generate insights explaining lifecycle stage, growth signals, and timing recommendations.

### Interface Definition (TypeScript)

```typescript
export interface IAIProvider {
  /**
   * Provider identification
   */
  getName(): string;
  getModel(): string; // e.g., 'gpt-4', 'claude-3', 'llama-70b'
  
  /**
   * Capability checks
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Lifecycle insight generation
   */
  generateLifecycleInsight(context: LifecycleInsightContext): Promise<AIInsightResult>;
  
  /**
   * Cost estimation
   */
  estimateCost(context: LifecycleInsightContext): number; // USD
  getTokensUsed(): number;
}

export interface LifecycleInsightContext {
  keyword: string;
  predictionScore: number;
  lifecycleStage: LifecycleStage;
  accelerationMetrics: {
    searchAcceleration: number;
    videoVelocity: number;
    creatorAdoptionRate: number;
    relatedQueryGrowth: number;
    viewVelocity: number;
  };
  confidenceLevel: ConfidenceLevel;
  rapidTransition: boolean;
  seasonalPattern: boolean | null;
  historicalDataDays: number;
}

export interface AIInsightResult {
  success: boolean;
  insight: string;
  timingRecommendation: TimingRecommendation;
  confidence: number; // AI's confidence in insight quality (0-100)
  tokensUsed: number;
  error?: string;
}

export enum LifecycleStage {
  SEED = 'seed',
  EMERGING = 'emerging',
  GROWING = 'growing',
  VIRAL = 'viral',
  SATURATED = 'saturated',
  DECLINING = 'declining',
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TimingRecommendation {
  EARLY = 'early',       // Excellent opportunity window
  ON_TIME = 'on_time',   // Good opportunity, rising competition
  LATE = 'late',         // Opportunity window closing
  AVOID = 'avoid',       // Saturated or declining
}
```

### Example Implementation: OpenAI Provider

```typescript
@Injectable()
export class OpenAIProvider implements IAIProvider {
  private readonly openai: OpenAI;
  private tokensUsed = 0;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  getName(): string {
    return 'OpenAI';
  }

  getModel(): string {
    return 'gpt-4-turbo';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check API health
      await this.openai.models.retrieve('gpt-4-turbo');
      return true;
    } catch {
      return false;
    }
  }

  async generateLifecycleInsight(
    context: LifecycleInsightContext
  ): Promise<AIInsightResult> {
    const prompt = this.buildLifecyclePrompt(context);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a trend prediction expert analyzing product lifecycle signals. Generate concise, actionable insights (2-3 sentences) explaining lifecycle stage and timing recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const insight = response.choices[0].message.content.trim();
      this.tokensUsed = response.usage.total_tokens;

      const timingRecommendation = this.inferTimingRecommendation(context);

      return {
        success: true,
        insight,
        timingRecommendation,
        confidence: 85, // GPT-4 typically high quality
        tokensUsed: this.tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        insight: '',
        timingRecommendation: TimingRecommendation.AVOID,
        confidence: 0,
        tokensUsed: 0,
        error: error.message,
      };
    }
  }

  private buildLifecyclePrompt(context: LifecycleInsightContext): string {
    const {
      keyword,
      predictionScore,
      lifecycleStage,
      accelerationMetrics,
      confidenceLevel,
      rapidTransition,
      seasonalPattern,
      historicalDataDays,
    } = context;

    let prompt = `Analyze this product trend prediction:

Keyword: "${keyword}"
Lifecycle Stage: ${lifecycleStage}
Prediction Score: ${predictionScore}/100 (probability of growth in next 7-30 days)
Data Confidence: ${confidenceLevel}

Growth Signals:
- Search Acceleration: ${(accelerationMetrics.searchAcceleration * 100).toFixed(1)}%
- Video Velocity: ${accelerationMetrics.videoVelocity.toFixed(1)} videos/day
- Creator Adoption Rate: ${accelerationMetrics.creatorAdoptionRate.toFixed(1)} new creators/day
- Related Query Growth: ${(accelerationMetrics.relatedQueryGrowth * 100).toFixed(1)}%
- View Velocity: ${(accelerationMetrics.viewVelocity * 100).toFixed(1)}% growth

Historical Data: ${historicalDataDays} days`;

    if (rapidTransition) {
      prompt += '\n⚠️ Rapid stage transition detected (viral acceleration)';
    }

    if (seasonalPattern) {
      prompt += '\n⚠️ Historical seasonal pattern detected';
    }

    prompt += `\n\nGenerate a concise insight (2-3 sentences) explaining:
1. Why this product is in the "${lifecycleStage}" stage
2. What growth signals are most significant
3. Whether the user is early, on time, or late to this opportunity`;

    return prompt;
  }

  private inferTimingRecommendation(
    context: LifecycleInsightContext
  ): TimingRecommendation {
    const { lifecycleStage, seasonalPattern } = context;

    // Avoid seasonal trends and declining products
    if (seasonalPattern || lifecycleStage === LifecycleStage.DECLINING) {
      return TimingRecommendation.AVOID;
    }

    // Excellent timing for early stages
    if (lifecycleStage === LifecycleStage.SEED || lifecycleStage === LifecycleStage.EMERGING) {
      return TimingRecommendation.EARLY;
    }

    // Good timing for growing stage
    if (lifecycleStage === LifecycleStage.GROWING) {
      return TimingRecommendation.ON_TIME;
    }

    // Late timing for viral/saturated
    return TimingRecommendation.LATE;
  }

  estimateCost(context: LifecycleInsightContext): number {
    // GPT-4 Turbo pricing: ~$0.01/1K input tokens, ~$0.03/1K output tokens
    // Estimated 200 input tokens + 150 output tokens
    const inputCost = (200 / 1000) * 0.01;
    const outputCost = (150 / 1000) * 0.03;
    return inputCost + outputCost;
  }

  getTokensUsed(): number {
    return this.tokensUsed;
  }
}
```

---

## Notification Provider Interface (Future)

Notification providers deliver alerts when significant events occur (stage transitions, prediction score spikes, etc.).

### Interface Definition (TypeScript)

```typescript
export interface INotificationProvider {
  getName(): string;
  getChannel(): NotificationChannel;
  
  isAvailable(): Promise<boolean>;
  
  sendAlert(alert: TrendAlert): Promise<NotificationResult>;
}

export interface TrendAlert {
  userId: string;
  keyword: string;
  alertType: AlertType;
  message: string;
  data: any;
}

export enum AlertType {
  STAGE_TRANSITION = 'stage_transition',
  SCORE_SPIKE = 'score_spike',
  RAPID_GROWTH = 'rapid_growth',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
}

export interface NotificationResult {
  success: boolean;
  sentAt: Date;
  error?: string;
}
```

---

## Provider Registration & Selection

### Provider Registry Service

```typescript
@Injectable()
export class ProviderRegistry {
  private signalProviders: Map<DataSource, ISignalProvider> = new Map();
  private aiProviders: Map<string, IAIProvider> = new Map();

  registerSignalProvider(provider: ISignalProvider): void {
    this.signalProviders.set(provider.getSource(), provider);
  }

  registerAIProvider(name: string, provider: IAIProvider): void {
    this.aiProviders.set(name, provider);
  }

  getSignalProvider(source: DataSource): ISignalProvider | undefined {
    return this.signalProviders.get(source);
  }

  getAIProvider(name: string): IAIProvider | undefined {
    return this.aiProviders.get(name);
  }

  getAllSignalProviders(): ISignalProvider[] {
    return Array.from(this.signalProviders.values());
  }
}
```

### Multi-Provider Signal Aggregation

```typescript
@Injectable()
export class SignalAggregationService {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly logger: Logger,
  ) {}

  async collectAllSignals(keyword: string): Promise<NormalizedSignals[]> {
    const providers = this.registry.getAllSignalProviders();
    const results = await Promise.allSettled(
      providers.map(p => this.collectFromProvider(p, keyword))
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<NormalizedSignals>).value);
  }

  private async collectFromProvider(
    provider: ISignalProvider,
    keyword: string
  ): Promise<NormalizedSignals> {
    const raw = await provider.collectSignals(keyword);
    return provider.normalizeSignals(raw);
  }

  mergeSignals(signals: NormalizedSignals[]): NormalizedSignals {
    // Combine signals from multiple providers
    // Prefer higher-confidence sources for overlapping metrics
    const merged: NormalizedSignals = {
      timestamp: new Date(),
      source: DataSource.GOOGLE_TRENDS, // Primary source
      searchVolume: null,
      videoCount: null,
      viewCount: null,
      uniqueCreators: null,
      engagementRate: null,
      confidence: 0,
      dataCompleteness: 0,
    };

    // Merge logic: prioritize non-null values with higher confidence
    for (const signal of signals) {
      if (signal.searchVolume !== null && merged.searchVolume === null) {
        merged.searchVolume = signal.searchVolume;
      }
      if (signal.videoCount !== null) {
        merged.videoCount = signal.videoCount;
      }
      // ... merge other fields
    }

    // Average confidence across providers
    merged.confidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    
    return merged;
  }
}
```

---

## Provider Testing Contract

All providers MUST implement testable contracts:

```typescript
describe('SignalProvider Contract', () => {
  let provider: ISignalProvider;

  it('should return provider name and source', () => {
    expect(provider.getName()).toBeDefined();
    expect(provider.getSource()).toBeDefined();
  });

  it('should validate keyword support', () => {
    expect(provider.supportsKeyword('valid keyword')).toBe(true);
    expect(provider.supportsKeyword('')).toBe(false);
  });

  it('should collect and normalize signals', async () => {
    const raw = await provider.collectSignals('test keyword');
    const normalized = provider.normalizeSignals(raw);
    
    expect(normalized.timestamp).toBeInstanceOf(Date);
    expect(normalized.confidence).toBeGreaterThanOrEqual(0);
    expect(normalized.confidence).toBeLessThanOrEqual(1);
  });

  it('should report rate limit status', () => {
    const status = provider.getRateLimitStatus();
    expect(status.remaining).toBeGreaterThanOrEqual(0);
    expect(status.resetAt).toBeInstanceOf(Date);
  });
});
```

---

**Provider contracts complete. Ready for REST API contracts.**
