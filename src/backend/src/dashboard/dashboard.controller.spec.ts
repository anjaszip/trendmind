import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { EmergingOpportunitiesService } from './emerging-opportunities.service';
import { AnalyticsService } from './analytics.service';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';

const mockOpportunity = {
  keywordId: 'kw-1',
  keyword: 'wireless earbuds',
  lifecycleStage: LifecycleStage.EMERGING,
  predictionScore: 72,
  confidenceLevel: ConfidenceLevel.MEDIUM,
  searchAcceleration: 0.18,
  videoVelocity: 4.5,
  creatorAdoptionRate: 0.9,
  insightText: 'Strong early signals detected.',
  timingRecommendation: 'early',
  rapidTransitionFlag: false,
  scoreChange: 5,
};

describe('DashboardController', () => {
  let controller: DashboardController;
  let opportunitiesService: jest.Mocked<EmergingOpportunitiesService>;
  let analyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: EmergingOpportunitiesService,
          useValue: {
            getEmergingOpportunities: jest.fn().mockResolvedValue([mockOpportunity]),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            getStageDistribution: jest.fn().mockResolvedValue([]),
            getRapidTransitions: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    opportunitiesService = module.get(EmergingOpportunitiesService);
    analyticsService = module.get(AnalyticsService);
  });

  describe('GET /dashboard/emerging-opportunities', () => {
    it('returns emerging opportunities with default filters', async () => {
      const result = await controller.getEmergingOpportunities();
      expect(result).toHaveLength(1);
      expect(result[0].keyword).toBe('wireless earbuds');
      expect(opportunitiesService.getEmergingOpportunities).toHaveBeenCalledWith({
        stages: undefined,
        minScore: 0,
        limit: 10,
        confidenceLevel: undefined,
      });
    });

    it('parses stages query param as comma-separated list', async () => {
      await controller.getEmergingOpportunities('seed,emerging', 20, undefined, 5);
      expect(opportunitiesService.getEmergingOpportunities).toHaveBeenCalledWith(
        expect.objectContaining({
          stages: [LifecycleStage.SEED, LifecycleStage.EMERGING],
          minScore: 20,
          limit: 5,
        }),
      );
    });

    it('caps limit at 50', async () => {
      await controller.getEmergingOpportunities(undefined, 0, undefined, 100);
      expect(opportunitiesService.getEmergingOpportunities).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 }),
      );
    });

    it('ignores invalid stage values in query param', async () => {
      await controller.getEmergingOpportunities('emerging,invalid_stage', 0);
      expect(opportunitiesService.getEmergingOpportunities).toHaveBeenCalledWith(
        expect.objectContaining({ stages: [LifecycleStage.EMERGING] }),
      );
    });
  });

  describe('GET /analytics/stage-distribution', () => {
    it('delegates to analytics service', async () => {
      await controller.getStageDistribution();
      expect(analyticsService.getStageDistribution).toHaveBeenCalled();
    });
  });

  describe('GET /analytics/rapid-transitions', () => {
    it('passes days parameter to analytics service', async () => {
      await controller.getRapidTransitions(14);
      expect(analyticsService.getRapidTransitions).toHaveBeenCalledWith(14);
    });

    it('defaults days to 7', async () => {
      await controller.getRapidTransitions(7);
      expect(analyticsService.getRapidTransitions).toHaveBeenCalledWith(7);
    });
  });
});
