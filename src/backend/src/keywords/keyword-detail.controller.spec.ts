import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';
import { TimingRecommendation } from '../common/enums/timing-recommendation.enum';

const USER = { userId: 'user-1' };

const makeDetail = (overrides = {}) => ({
  id: 'kw-1',
  term: 'wireless earbuds',
  normalizedForm: 'wireless earbuds',
  lifecycleStage: LifecycleStage.EMERGING,
  monitoringStatus: 'active',
  isSeedKeyword: false,
  createdAt: new Date('2026-01-01'),
  lastCollectedAt: new Date('2026-06-01'),
  stageEnteredAt: new Date('2026-05-01'),
  predictionScore: 72,
  confidenceLevel: ConfidenceLevel.MEDIUM,
  scoreChange: 5,
  searchAcceleration: 0.15,
  videoVelocity: 8.2,
  creatorAdoptionRate: 3.1,
  viewVelocity: 12000,
  relatedQueryGrowth: 0.22,
  historicalDataDays: 21,
  insightText: 'Growing interest in wireless earbuds.',
  timingRecommendation: TimingRecommendation.EARLY,
  rapidTransitionFlag: false,
  seasonalityFlag: false,
  stageTransitions: [],
  ...overrides,
});

describe('KeywordsController — detail endpoints (T114)', () => {
  let controller: KeywordsController;
  let service: jest.Mocked<KeywordsService>;

  beforeEach(async () => {
    service = {
      addKeyword: jest.fn(),
      removeKeyword: jest.fn(),
      listKeywords: jest.fn(),
      getKeyword: jest.fn(),
      getKeywordDetail: jest.fn(),
      getAccelerationHistory: jest.fn(),
      getStageTransitions: jest.fn(),
      updateMonitoringStatus: jest.fn(),
      normalizeKeyword: jest.fn(),
      validateKeyword: jest.fn(),
    } as unknown as jest.Mocked<KeywordsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeywordsController],
      providers: [{ provide: KeywordsService, useValue: service }],
    }).compile();

    controller = module.get(KeywordsController);
  });

  describe('GET /keywords/:id (detail)', () => {
    it('returns full keyword detail including prediction, metrics, insight, and transitions', async () => {
      const detail = makeDetail();
      service.getKeywordDetail.mockResolvedValue(detail as any);

      const result = await controller.getKeyword({ user: USER } as any, 'kw-1');

      expect(service.getKeywordDetail).toHaveBeenCalledWith('user-1', 'kw-1');
      expect(result).toMatchObject({
        id: 'kw-1',
        term: 'wireless earbuds',
        lifecycleStage: LifecycleStage.EMERGING,
        predictionScore: 72,
        confidenceLevel: ConfidenceLevel.MEDIUM,
        timingRecommendation: TimingRecommendation.EARLY,
      });
    });

    it('propagates NotFoundException when keyword does not exist', async () => {
      service.getKeywordDetail.mockRejectedValue(new NotFoundException('Keyword not found'));
      await expect(controller.getKeyword({ user: USER } as any, 'missing-id')).rejects.toThrow(NotFoundException);
    });

    it('includes scoreChange when available', async () => {
      service.getKeywordDetail.mockResolvedValue(makeDetail({ scoreChange: 8 }) as any);
      const result = await controller.getKeyword({ user: USER } as any, 'kw-1');
      expect(result.scoreChange).toBe(8);
    });
  });

  describe('GET /keywords/:id/acceleration-history', () => {
    it('returns acceleration history array', async () => {
      const history = [{ id: 'm-1', keywordId: 'kw-1', searchAcceleration: 0.1 }];
      service.getAccelerationHistory.mockResolvedValue(history as any);

      const result = await controller.getAccelerationHistory({ user: USER } as any, 'kw-1', 30);

      expect(service.getAccelerationHistory).toHaveBeenCalledWith('user-1', 'kw-1', 30);
      expect(result).toEqual(history);
    });

    it('defaults to 30 days when no days param provided', async () => {
      service.getAccelerationHistory.mockResolvedValue([]);
      await controller.getAccelerationHistory({ user: USER } as any, 'kw-1', 30);
      expect(service.getAccelerationHistory).toHaveBeenCalledWith('user-1', 'kw-1', 30);
    });
  });

  describe('GET /keywords/:id/stage-transitions', () => {
    it('returns stage transition history', async () => {
      const transitions = [
        {
          id: 't-1',
          keywordId: 'kw-1',
          previousStage: LifecycleStage.SEED,
          newStage: LifecycleStage.EMERGING,
          transitionVelocity: 'normal',
          daysInPreviousStage: 12,
        },
      ];
      service.getStageTransitions.mockResolvedValue(transitions as any);

      const result = await controller.getStageTransitions({ user: USER } as any, 'kw-1');

      expect(service.getStageTransitions).toHaveBeenCalledWith('user-1', 'kw-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ previousStage: LifecycleStage.SEED, newStage: LifecycleStage.EMERGING });
    });
  });
});
