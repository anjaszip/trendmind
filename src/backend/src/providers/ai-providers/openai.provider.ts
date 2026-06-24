import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAIProvider, AIInsightResult } from './ai-provider.interface';
import { LifecycleInsightContext } from './lifecycle-insight-context.interface';

const PROMPT_VERSION = '1.1.0';

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
                'You are a TikTok/YouTube trend analysis assistant helping content creators decide when to produce content about emerging product trends. ' +
                'Analyze lifecycle signals and provide a concise, actionable 2-3 sentence insight. ' +
                'Focus on: (1) what the growth signals mean right now, (2) the timing opportunity for creators, and (3) a specific action recommendation.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 250,
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

    const stageExplanations: Record<string, string> = {
      seed: 'early discovery phase — very few creators covering it, audience interest just beginning',
      emerging: 'gaining initial traction with early adopters, search interest climbing noticeably',
      growing: 'mainstream adoption underway, strong creator and audience growth across the board',
      viral: 'peak adoption — high competition, saturated feed, audience fatigue setting in',
      saturated: 'market is crowded, most audiences have seen the content, differentiation is hard',
      declining: 'interest dropping, audience moving on to newer trends',
    };

    const timingRationale: Record<string, string> = {
      seed: 'EARLY — act now to establish authority before the mainstream wave arrives',
      emerging: 'EARLY — significant upside remains, first-mover advantage still available',
      growing: 'ON TIME — solid audience exists, competition still manageable, good ROI window',
      viral: 'LATE — high competition and audience fatigue reduce return on new content',
      saturated: 'LATE — difficult to stand out, only highly differentiated content will perform',
      declining: 'AVOID — declining interest means poor long-term content performance',
    };

    const fmt = (v: number | null, unit = '') => (v != null ? `${v.toFixed(2)}${unit}` : 'N/A');

    const lines: string[] = [
      `Product keyword: "${ctx.keyword}"`,
      `Lifecycle stage: ${ctx.lifecycleStage} — ${stageExplanations[ctx.lifecycleStage] ?? 'unknown stage'}`,
      `Prediction score: ${ctx.predictionScore}/100`,
      ``,
      `Growth signals (${ctx.historicalDataDays} days of data, confidence: ${ctx.confidenceLevel.toUpperCase()}):`,
      `  Search acceleration: ${fmt(accel.searchAcceleration, '%')}`,
      `  Video velocity: ${fmt(accel.videoVelocity, ' new videos/day')}`,
      `  Creator adoption: ${fmt(accel.creatorAdoptionRate, ' new creators/day')}`,
      `  Related query growth: ${fmt(accel.relatedQueryGrowth, '%')}`,
      ``,
      `Timing recommendation: ${timingRationale[ctx.lifecycleStage] ?? 'EARLY'}`,
    ];

    if (ctx.rapidTransition && ctx.rapidTransitionDetails) {
      const { previousStage, newStage, daysInPreviousStage } = ctx.rapidTransitionDetails;
      lines.push(
        ``,
        `⚠️ RAPID STAGE TRANSITION: "${ctx.keyword}" jumped from ${previousStage} → ${newStage} in only ${daysInPreviousStage} day(s). The opportunity window may be closing faster than normal.`,
      );
    } else if (ctx.rapidTransition) {
      lines.push(``, `⚠️ RAPID STAGE TRANSITION detected — opportunity window may be closing faster than normal.`);
    }

    if (ctx.seasonalPattern) {
      lines.push(``, `📅 SEASONAL PATTERN: This keyword shows recurring growth cycles — factor in calendar timing for content planning.`);
    }

    lines.push(``, `In 2-3 sentences: explain what these signals mean right now and give a specific timing recommendation for content creators.`);

    return lines.join('\n');
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
    const timing = this.mapTimingRecommendation(ctx.lifecycleStage);
    const rapidNote = ctx.rapidTransitionDetails
      ? ` ⚠️ Rapid stage transition detected (${ctx.rapidTransitionDetails.previousStage} → ${ctx.rapidTransitionDetails.newStage} in ${ctx.rapidTransitionDetails.daysInPreviousStage} day(s)) — the opportunity window may be closing faster than normal.`
      : ctx.rapidTransition
        ? ' ⚠️ Rapid stage transition detected — the opportunity window may be closing faster than normal.'
        : '';
    const seasonalNote = ctx.seasonalPattern ? ' Seasonal patterns suggest recurring growth cycles — factor in calendar timing.' : '';
    return {
      insightText:
        `"${ctx.keyword}" is in the ${ctx.lifecycleStage} stage with a prediction score of ${ctx.predictionScore}/100.${rapidNote}${seasonalNote} Timing recommendation: ${timing.replace('_', ' ')}.`,
      timingRecommendation: timing,
      seasonalityFlag: ctx.seasonalPattern,
      rapidTransitionFlag: ctx.rapidTransition,
      confidenceScore: 20,
      tokenCount: 0,
      promptVersion: PROMPT_VERSION,
      aiProvider: this.providerName,
    };
  }
}
