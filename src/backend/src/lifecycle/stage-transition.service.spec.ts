import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StageTransitionService } from './stage-transition.service';
import { StageTransitionEvent } from './entities/stage-transition-event.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';

const makeKeyword = (stageEnteredAt: Date): Keyword =>
  ({ id: 'kw-1', stageEnteredAt } as Keyword);

const makeTransitionEvent = (overrides: Partial<StageTransitionEvent> = {}): StageTransitionEvent =>
  ({
    id: 'ev-1',
    keywordId: 'kw-1',
    previousStage: LifecycleStage.SEED,
    newStage: LifecycleStage.EMERGING,
    transitionTimestamp: new Date(),
    transitionVelocity: 'normal',
    daysInPreviousStage: 10,
    triggerSignals: [],
    ...overrides,
  } as StageTransitionEvent);

describe('StageTransitionService', () => {
  let service: StageTransitionService;
  let transitionRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let keywordRepo: { findOneByOrFail: jest.Mock };

  beforeEach(async () => {
    transitionRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ ...v, id: 'ev-1' })),
      find: jest.fn(async () => []),
    };
    keywordRepo = { findOneByOrFail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StageTransitionService,
        { provide: getRepositoryToken(StageTransitionEvent), useValue: transitionRepo },
        { provide: getRepositoryToken(Keyword), useValue: keywordRepo },
      ],
    }).compile();

    service = module.get(StageTransitionService);
  });

  describe('detectRapidTransition()', () => {
    it('returns true when keyword changed stage in fewer than 7 days', () => {
      expect(service.detectRapidTransition(6)).toBe(true);
    });

    it('returns true for exactly 0 days', () => {
      expect(service.detectRapidTransition(0)).toBe(true);
    });

    it('returns false when keyword changed stage after exactly 7 days', () => {
      expect(service.detectRapidTransition(7)).toBe(false);
    });

    it('returns false when keyword spent 14 days in previous stage (normal velocity)', () => {
      expect(service.detectRapidTransition(14)).toBe(false);
    });

    it('returns false for long-running stage (stagnant velocity)', () => {
      expect(service.detectRapidTransition(45)).toBe(false);
    });
  });

  describe('logTransition()', () => {
    it('saves a transition event with correct velocity for rapid transition (<7 days)', async () => {
      const enteredAt = new Date(Date.now() - 3 * 86_400_000); // 3 days ago
      keywordRepo.findOneByOrFail.mockResolvedValue(makeKeyword(enteredAt));

      const event = await service.logTransition({
        keywordId: 'kw-1',
        previousStage: LifecycleStage.SEED,
        newStage: LifecycleStage.EMERGING,
      });

      expect(transitionRepo.save).toHaveBeenCalledTimes(1);
      expect(event.transitionVelocity).toBe('rapid');
      expect(event.previousStage).toBe(LifecycleStage.SEED);
      expect(event.newStage).toBe(LifecycleStage.EMERGING);
    });

    it('saves a transition event with normal velocity for 7–14 day transitions', async () => {
      const enteredAt = new Date(Date.now() - 10 * 86_400_000); // 10 days ago
      keywordRepo.findOneByOrFail.mockResolvedValue(makeKeyword(enteredAt));

      const event = await service.logTransition({
        keywordId: 'kw-1',
        previousStage: LifecycleStage.EMERGING,
        newStage: LifecycleStage.GROWING,
      });

      expect(event.transitionVelocity).toBe('normal');
    });

    it('saves a transition event with stagnant velocity for >30 day transitions', async () => {
      const enteredAt = new Date(Date.now() - 45 * 86_400_000);
      keywordRepo.findOneByOrFail.mockResolvedValue(makeKeyword(enteredAt));

      const event = await service.logTransition({
        keywordId: 'kw-1',
        previousStage: LifecycleStage.SEED,
        newStage: LifecycleStage.EMERGING,
        accelerationAtTransition: 0.42,
      });

      expect(event.transitionVelocity).toBe('stagnant');
      expect(event.triggerSignals).toContain('search_acceleration:0.420');
    });

    it('omits acceleration from trigger signals when not provided', async () => {
      const enteredAt = new Date(Date.now() - 10 * 86_400_000);
      keywordRepo.findOneByOrFail.mockResolvedValue(makeKeyword(enteredAt));

      const event = await service.logTransition({
        keywordId: 'kw-1',
        previousStage: LifecycleStage.SEED,
        newStage: LifecycleStage.EMERGING,
      });

      expect(event.triggerSignals).toHaveLength(1);
      expect(event.triggerSignals[0]).toMatch(/stage_change/);
    });
  });

  describe('getTransitionHistory()', () => {
    it('returns all transitions for the keyword ordered by timestamp DESC', async () => {
      const events = [makeTransitionEvent({ id: 'ev-1' }), makeTransitionEvent({ id: 'ev-2' })];
      transitionRepo.find.mockResolvedValue(events);

      const result = await service.getTransitionHistory('kw-1');

      expect(transitionRepo.find).toHaveBeenCalledWith({
        where: { keywordId: 'kw-1' },
        order: { transitionTimestamp: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when keyword has no transitions', async () => {
      transitionRepo.find.mockResolvedValue([]);
      const result = await service.getTransitionHistory('kw-1');
      expect(result).toEqual([]);
    });
  });
});
