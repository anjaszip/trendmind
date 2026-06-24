import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InsightGenerator } from './insight-generator';
import { AIInsight } from './entities/ai-insight.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { TimingRecommendation } from '../common/enums/timing-recommendation.enum';
import { IAIProvider } from '../providers/ai-providers/ai-provider.interface';
import { LifecycleInsightContext } from '../providers/ai-providers/lifecycle-insight-context.interface';

const makeContext = (
  stage: LifecycleStage,
  extras: Partial<LifecycleInsightContext> = {},
): LifecycleInsightContext => ({
  keywordId: 'kw-1',
  keyword: 'test keyword',
  lifecycleStage: stage,
  predictionScore: 50,
  accelerationMetrics: {
    searchAcceleration: 0.1,
    videoVelocity: 5,
    creatorAdoptionRate: 2,
    relatedQueryGrowth: 0.3,
  },
  rapidTransition: false,
  seasonalPattern: false,
  confidenceLevel: 'medium',
  historicalDataDays: 20,
  ...extras,
});

describe('InsightGenerator — timing recommendation mapping', () => {
  let generator: InsightGenerator;
  let insightRepo: { create: jest.Mock; save: jest.Mock };
  let mockProvider: jest.Mocked<IAIProvider>;

  beforeEach(async () => {
    insightRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ ...v, id: 'ins-1' })),
    };

    mockProvider = {
      providerName: 'mock',
      generateLifecycleInsight: jest.fn(),
    } as jest.Mocked<IAIProvider>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightGenerator,
        { provide: getRepositoryToken(AIInsight), useValue: insightRepo },
      ],
    }).compile();

    generator = module.get(InsightGenerator);
  });

  const timingCases: Array<[LifecycleStage, TimingRecommendation]> = [
    [LifecycleStage.SEED, TimingRecommendation.EARLY],
    [LifecycleStage.EMERGING, TimingRecommendation.EARLY],
    [LifecycleStage.GROWING, TimingRecommendation.ON_TIME],
    [LifecycleStage.VIRAL, TimingRecommendation.LATE],
    [LifecycleStage.SATURATED, TimingRecommendation.LATE],
    [LifecycleStage.DECLINING, TimingRecommendation.AVOID],
  ];

  test.each(timingCases)(
    'stage %s maps to timing recommendation %s',
    async (stage, expectedTiming) => {
      mockProvider.generateLifecycleInsight.mockResolvedValue({
        insightText: 'Test insight',
        timingRecommendation: expectedTiming,
        seasonalityFlag: false,
        rapidTransitionFlag: false,
        confidenceScore: 80,
        aiProvider: 'openai',
        tokenCount: 100,
        promptVersion: '1.0',
      });

      const insight = await generator.generateLifecycleInsight(
        mockProvider,
        makeContext(stage),
      );

      expect(insight.timingRecommendation).toBe(expectedTiming);
    },
  );

  it('saves insight with rapidTransitionFlag=true when context indicates rapid transition', async () => {
    mockProvider.generateLifecycleInsight.mockResolvedValue({
      insightText: '⚠️ Rapid transition detected',
      timingRecommendation: TimingRecommendation.EARLY,
      seasonalityFlag: false,
      rapidTransitionFlag: true,
      confidenceScore: 70,
      aiProvider: 'openai',
      tokenCount: 80,
      promptVersion: '1.0',
    });

    const insight = await generator.generateLifecycleInsight(
      mockProvider,
      makeContext(LifecycleStage.EMERGING, { rapidTransition: true }),
    );

    expect(insight.rapidTransitionFlag).toBe(true);
    expect(insightRepo.save).toHaveBeenCalledTimes(1);
  });

  it('saves insight with seasonalityFlag=true when seasonal pattern detected', async () => {
    mockProvider.generateLifecycleInsight.mockResolvedValue({
      insightText: 'Seasonal pattern detected',
      timingRecommendation: TimingRecommendation.EARLY,
      seasonalityFlag: true,
      rapidTransitionFlag: false,
      confidenceScore: 65,
      aiProvider: 'openai',
      tokenCount: 90,
      promptVersion: '1.0',
    });

    const insight = await generator.generateLifecycleInsight(
      mockProvider,
      makeContext(LifecycleStage.SEED, { seasonalPattern: true }),
    );

    expect(insight.seasonalityFlag).toBe(true);
  });
});
