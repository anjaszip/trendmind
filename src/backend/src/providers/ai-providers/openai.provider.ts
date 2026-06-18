import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider, AIInsightResult } from './ai-provider.interface';
import { LifecycleInsightContext } from './lifecycle-insight-context.interface';

const PROMPT_VERSION = '1.0.0';

@Injectable()
export class OpenAIProvider implements IAIProvider {
  readonly providerName = 'openai-gpt4';
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = configService.get<string>('OPENAI_API_KEY', '');
  }

  async generateLifecycleInsight(context: LifecycleInsightContext): Promise<AIInsightResult> {
    const prompt = this.buildPrompt(context);
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are a trend analysis assistant. Provide concise, actionable insights about product trends. Respond in 2-3 sentences.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { total_tokens: number };
      };
      const insightText = data.choices[0]?.message?.content?.trim() ?? '';
      const tokenCount = data.usage?.total_tokens ?? 0;

      return {
        insightText,
        timingRecommendation: this.mapTimingRecommendation(context.lifecycleStage),
        seasonalityFlag: context.seasonalPattern,
        rapidTransitionFlag: context.rapidTransition,
        confidenceScore: this.mapConfidenceScore(context.confidenceLevel),
        tokenCount,
        promptVersion: PROMPT_VERSION,
        aiProvider: this.providerName,
      };
    } catch (err) {
      this.logger.error(`OpenAI insight generation failed: ${err}`);
      return this.fallbackInsight(context);
    }
  }

  private buildPrompt(ctx: LifecycleInsightContext): string {
    const accel = ctx.accelerationMetrics;
    const rapidNote = ctx.rapidTransition ? ' Note: rapid stage transition detected.' : '';
    const seasonalNote = ctx.seasonalPattern ? ' Seasonal pattern detected.' : '';
    return (
      `Product keyword: "${ctx.keyword}"\n` +
      `Lifecycle stage: ${ctx.lifecycleStage} (prediction score: ${ctx.predictionScore}/100)\n` +
      `Search acceleration: ${accel.searchAcceleration ?? 'N/A'}%\n` +
      `Video velocity: ${accel.videoVelocity ?? 'N/A'} new videos/day\n` +
      `Creator adoption rate: ${accel.creatorAdoptionRate ?? 'N/A'} new creators/day\n` +
      `Data confidence: ${ctx.confidenceLevel} (${ctx.historicalDataDays} days of history)\n` +
      `${rapidNote}${seasonalNote}\n\n` +
      'Explain the lifecycle stage, what the growth signals mean for this product, and the timing recommendation for content creators.'
    );
  }

  private mapTimingRecommendation(stage: string): string {
    const map: Record<string, string> = {
      seed: 'early',
      emerging: 'early',
      growing: 'on_time',
      viral: 'late',
      saturated: 'late',
      declining: 'avoid',
    };
    return map[stage] ?? 'early';
  }

  private mapConfidenceScore(level: string): number {
    return { low: 30, medium: 65, high: 90 }[level] ?? 30;
  }

  private fallbackInsight(ctx: LifecycleInsightContext): AIInsightResult {
    return {
      insightText: `"${ctx.keyword}" is in the ${ctx.lifecycleStage} stage with a prediction score of ${ctx.predictionScore}. Insufficient data to generate a detailed insight at this time.`,
      timingRecommendation: this.mapTimingRecommendation(ctx.lifecycleStage),
      seasonalityFlag: ctx.seasonalPattern,
      rapidTransitionFlag: ctx.rapidTransition,
      confidenceScore: 20,
      tokenCount: 0,
      promptVersion: PROMPT_VERSION,
      aiProvider: this.providerName,
    };
  }
}
