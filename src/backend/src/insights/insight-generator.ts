import { Injectable } from '@nestjs/common';
import { IAIProvider } from '../providers/ai-providers/ai-provider.interface';
import { LifecycleInsightContext } from '../providers/ai-providers/lifecycle-insight-context.interface';
import { AIInsight } from './entities/ai-insight.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimingRecommendation } from '../common/enums/timing-recommendation.enum';

@Injectable()
export class InsightGenerator {
  constructor(
    @InjectRepository(AIInsight)
    private readonly insightRepo: Repository<AIInsight>,
  ) {}

  async generateLifecycleInsight(
    provider: IAIProvider,
    context: LifecycleInsightContext,
  ): Promise<AIInsight> {
    const result = await provider.generateLifecycleInsight(context);

    const insight = this.insightRepo.create({
      keywordId: context.keywordId,
      insightText: result.insightText,
      lifecycleStageExplained: context.lifecycleStage,
      timingRecommendation: result.timingRecommendation as TimingRecommendation,
      seasonalityFlag: result.seasonalityFlag,
      rapidTransitionFlag: result.rapidTransitionFlag,
      confidenceScore: result.confidenceScore,
      aiProvider: result.aiProvider,
      tokenCount: result.tokenCount,
      promptVersion: result.promptVersion,
      generationTimestamp: new Date(),
    });

    return this.insightRepo.save(insight);
  }
}
