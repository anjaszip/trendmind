import { ScoringService } from './scoring.service';
import { PREDICTION_WEIGHTS } from './config/weights.config';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  describe('calculateWeightedScore', () => {
    it('returns 0 when all percentile ranks are 0', () => {
      const ranks = {
        searchAcceleration: 0,
        videoVelocity: 0,
        creatorAdoptionRate: 0,
        relatedQueryGrowth: 0,
        viewVelocity: 0,
      };
      expect(service.calculateWeightedScore(ranks)).toBe(0);
    });

    it('returns 100 when all percentile ranks are 100', () => {
      const ranks = {
        searchAcceleration: 100,
        videoVelocity: 100,
        creatorAdoptionRate: 100,
        relatedQueryGrowth: 100,
        viewVelocity: 100,
      };
      expect(service.calculateWeightedScore(ranks)).toBe(100);
    });

    it('applies weights correctly with only searchAcceleration at 100', () => {
      const ranks = {
        searchAcceleration: 100,
        videoVelocity: 0,
        creatorAdoptionRate: 0,
        relatedQueryGrowth: 0,
        viewVelocity: 0,
      };
      const expected = Math.round(PREDICTION_WEIGHTS.searchAcceleration * 100);
      expect(service.calculateWeightedScore(ranks)).toBe(expected);
    });

    it('clamps score to 0-100 range', () => {
      const ranks = {
        searchAcceleration: 120,
        videoVelocity: 110,
        creatorAdoptionRate: 105,
        relatedQueryGrowth: 110,
        viewVelocity: 115,
      };
      const result = service.calculateWeightedScore(ranks);
      expect(result).toBeLessThanOrEqual(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyWeights', () => {
    it('returns weighted components for each metric', () => {
      const ranks = {
        searchAcceleration: 80,
        videoVelocity: 60,
        creatorAdoptionRate: 40,
        relatedQueryGrowth: 20,
        viewVelocity: 10,
      };
      const components = service.applyWeights(ranks);
      expect(components.searchAccelerationComponent).toBeCloseTo(80 * PREDICTION_WEIGHTS.searchAcceleration, 2);
      expect(components.videoVelocityComponent).toBeCloseTo(60 * PREDICTION_WEIGHTS.videoVelocity, 2);
    });
  });
});
