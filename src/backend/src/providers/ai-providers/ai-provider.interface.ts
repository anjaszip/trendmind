import { LifecycleInsightContext } from './lifecycle-insight-context.interface';

export interface AIInsightResult {
  insightText: string;
  timingRecommendation: string;
  seasonalityFlag: boolean;
  rapidTransitionFlag: boolean;
  confidenceScore: number;
  tokenCount: number;
  promptVersion: string;
  aiProvider: string;
}

export interface IAIProvider {
  readonly providerName: string;

  generateLifecycleInsight(context: LifecycleInsightContext): Promise<AIInsightResult>;
}

export const AI_PROVIDER = Symbol('IAIProvider');
