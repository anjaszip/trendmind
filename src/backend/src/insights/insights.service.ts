import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { InsightGenerator } from './insight-generator';
import { SeasonalityDetector } from './seasonality-detector';
import { OpenAIProvider } from '../providers/ai-providers/openai.provider';
import { CacheService, CACHE_TTLS } from '../common/cache/cache.service';
import { PredictionService } from '../prediction/prediction.service';
import { Keyword } from '../keywords/entities/keyword.entity';
import { AccelerationService } from '../acceleration/acceleration.service';
import { StageTransitionService } from '../lifecycle/stage-transition.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectRepository(AIInsight)
    private readonly insightRepo: Repository<AIInsight>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    private readonly generator: InsightGenerator,
    private readonly seasonalityDetector: SeasonalityDetector,
    private readonly openAIProvider: OpenAIProvider,
    private readonly cacheService: CacheService,
    private readonly predictionService: PredictionService,
    private readonly accelerationService: AccelerationService,
    private readonly stageTransitionService: StageTransitionService,
  ) {}

  async generateInsight(keywordId: string): Promise<AIInsight> {
    const cacheKey = `insight:${keywordId}`;
    const cached = await this.cacheService.get<AIInsight>(cacheKey);
    if (cached) return cached;

    const keyword = await this.keywordRepo.findOneByOrFail({ id: keywordId });
    const metrics = await this.accelerationService.getLatestMetrics(keywordId);
    const score = await this.predictionService.getLatestScore(keywordId);
    const seasonalPattern = await this.seasonalityDetector.detectSeasonalPattern(keywordId);

    const transitions = await this.stageTransitionService.getTransitionHistory(keywordId);
    const latestTransition = transitions[0] ?? null;
    const isRapid = latestTransition
      ? this.stageTransitionService.detectRapidTransition(latestTransition.daysInPreviousStage)
      : false;

    const insight = await this.generator.generateLifecycleInsight(this.openAIProvider, {
      keywordId,
      keyword: keyword.originalTerm,
      lifecycleStage: keyword.currentLifecycleStage,
      predictionScore: score?.score ?? 0,
      accelerationMetrics: {
        searchAcceleration: metrics?.searchAcceleration ?? null,
        videoVelocity: metrics?.videoVelocity ?? null,
        creatorAdoptionRate: metrics?.creatorAdoptionRate ?? null,
        relatedQueryGrowth: metrics?.relatedQueryGrowth ?? null,
      },
      rapidTransition: isRapid,
      rapidTransitionDetails: isRapid && latestTransition
        ? {
            previousStage: latestTransition.previousStage,
            newStage: latestTransition.newStage,
            daysInPreviousStage: latestTransition.daysInPreviousStage,
          }
        : undefined,
      seasonalPattern,
      confidenceLevel: metrics?.confidenceLevel ?? 'low',
      historicalDataDays: metrics?.historicalDataDays ?? 0,
    });

    await this.cacheInsight(keywordId, insight);
    return insight;
  }

  async refreshInsight(keywordId: string): Promise<AIInsight> {
    await this.cacheService.invalidate(`insight:${keywordId}`);
    return this.generateInsight(keywordId);
  }

  async getLatestInsight(keywordId: string): Promise<AIInsight | null> {
    return this.insightRepo.findOne({
      where: { keywordId },
      order: { generationTimestamp: 'DESC' },
    });
  }

  private async cacheInsight(keywordId: string, insight: AIInsight): Promise<void> {
    await this.cacheService.set(`insight:${keywordId}`, insight, CACHE_TTLS.AI_INSIGHTS);
  }
}
