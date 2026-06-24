import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { PredictionScore } from '../prediction/entities/prediction-score.entity';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { AIInsight } from '../insights/entities/ai-insight.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';
import { TimingRecommendation } from '../common/enums/timing-recommendation.enum';
import { CacheService, CACHE_TTLS } from '../common/cache/cache.service';

export interface OpportunityFilters {
  stages?: LifecycleStage[];
  minScore?: number;
  confidenceLevel?: ConfidenceLevel;
  limit?: number;
}

export interface EmergingOpportunity {
  keywordId: string;
  keyword: string;
  lifecycleStage: LifecycleStage;
  predictionScore: number;
  confidenceLevel: ConfidenceLevel;
  searchAcceleration: number | null;
  videoVelocity: number | null;
  creatorAdoptionRate: number | null;
  insightText: string | null;
  timingRecommendation: TimingRecommendation | null;
  rapidTransitionFlag: boolean;
  scoreChange: number | null;
}

@Injectable()
export class EmergingOpportunitiesService {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(PredictionScore)
    private readonly scoreRepo: Repository<PredictionScore>,
    @InjectRepository(AccelerationMetrics)
    private readonly metricsRepo: Repository<AccelerationMetrics>,
    @InjectRepository(AIInsight)
    private readonly insightRepo: Repository<AIInsight>,
    private readonly cacheService: CacheService,
  ) {}

  async getEmergingOpportunities(filters: OpportunityFilters = {}): Promise<EmergingOpportunity[]> {
    const {
      stages = [LifecycleStage.SEED, LifecycleStage.EMERGING],
      minScore = 0,
      confidenceLevel,
      limit = 10,
    } = filters;

    const cacheKey = `dashboard:opportunities:${stages.join(',')}_${minScore}_${confidenceLevel ?? 'any'}_${limit}`;
    const cached = await this.cacheService.get<EmergingOpportunity[]>(cacheKey);
    if (cached) return cached;

    const keywords = await this.keywordRepo.find({
      where: { currentLifecycleStage: In(stages), monitoringStatus: 'active' },
    });

    if (keywords.length === 0) return [];

    const keywordIds = keywords.map((k) => k.id);

    const [latestScores, latestMetrics, latestInsights] = await Promise.all([
      this.getLatestScores(keywordIds),
      this.getLatestMetrics(keywordIds),
      this.getLatestInsights(keywordIds),
    ]);

    const opportunities: EmergingOpportunity[] = keywords
      .flatMap((kw) => {
        const score = latestScores.get(kw.id);
        if (!score || score.score < minScore) return [];
        if (confidenceLevel && score.confidenceLevel !== confidenceLevel) return [];

        const metrics = latestMetrics.get(kw.id);
        const insight = latestInsights.get(kw.id);

        const opp: EmergingOpportunity = {
          keywordId: kw.id,
          keyword: kw.originalTerm,
          lifecycleStage: kw.currentLifecycleStage,
          predictionScore: score.score,
          confidenceLevel: score.confidenceLevel,
          searchAcceleration: metrics ? Number(metrics.searchAcceleration) : null,
          videoVelocity: metrics ? Number(metrics.videoVelocity) : null,
          creatorAdoptionRate: metrics ? Number(metrics.creatorAdoptionRate) : null,
          insightText: insight?.insightText ?? null,
          timingRecommendation: (insight?.timingRecommendation ?? null) as TimingRecommendation | null,
          rapidTransitionFlag: insight?.rapidTransitionFlag ?? false,
          scoreChange: (score.scoreChange ?? null) as number | null,
        };
        return [opp];
      })
      .sort((a, b) => b.predictionScore - a.predictionScore)
      .slice(0, limit);

    await this.cacheService.set(cacheKey, opportunities, CACHE_TTLS.DASHBOARD);
    return opportunities;
  }

  private async getLatestScores(keywordIds: string[]): Promise<Map<string, PredictionScore>> {
    const scores = await this.scoreRepo
      .createQueryBuilder('ps')
      .where('ps.keywordId IN (:...keywordIds)', { keywordIds })
      .distinctOn(['ps.keywordId'])
      .orderBy('ps.keywordId')
      .addOrderBy('ps.calculationTimestamp', 'DESC')
      .getMany();
    return new Map(scores.map((s) => [s.keywordId, s]));
  }

  private async getLatestMetrics(keywordIds: string[]): Promise<Map<string, AccelerationMetrics>> {
    const metrics = await this.metricsRepo
      .createQueryBuilder('am')
      .where('am.keywordId IN (:...keywordIds)', { keywordIds })
      .distinctOn(['am.keywordId'])
      .orderBy('am.keywordId')
      .addOrderBy('am.calculationTimestamp', 'DESC')
      .getMany();
    return new Map(metrics.map((m) => [m.keywordId, m]));
  }

  private async getLatestInsights(keywordIds: string[]): Promise<Map<string, AIInsight>> {
    const insights = await this.insightRepo
      .createQueryBuilder('ai')
      .where('ai.keywordId IN (:...keywordIds)', { keywordIds })
      .distinctOn(['ai.keywordId'])
      .orderBy('ai.keywordId')
      .addOrderBy('ai.generationTimestamp', 'DESC')
      .getMany();
    return new Map(insights.map((i) => [i.keywordId, i]));
  }
}
