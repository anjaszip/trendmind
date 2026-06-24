import { MetricsCalculator } from './metrics-calculator';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';

function makeDataPoint(overrides: Partial<TrendDataPoint>): TrendDataPoint {
  const dp = new TrendDataPoint();
  dp.searchVolume = 100;
  dp.videoCount = 10;
  dp.viewCount = 10000;
  dp.uniqueCreators = 5;
  dp.relatedQueryBreakouts = 2;
  dp.timestamp = new Date();
  return Object.assign(dp, overrides);
}

function daysAgo(n: number): Date {
  const d = new Date('2026-06-22T00:00:00Z');
  d.setDate(d.getDate() - n);
  return d;
}

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;

  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  describe('calculateSearchAcceleration', () => {
    it('returns positive acceleration when volume increases over time', () => {
      const dataPoints = [
        makeDataPoint({ timestamp: daysAgo(30), searchVolume: 50 }),
        makeDataPoint({ timestamp: daysAgo(15), searchVolume: 75 }),
        makeDataPoint({ timestamp: daysAgo(0), searchVolume: 100 }),
      ];
      const result = calculator.calculateSearchAcceleration(dataPoints);
      expect(result).toBeGreaterThan(0);
    });

    it('returns negative acceleration when volume decreases', () => {
      const dataPoints = [
        makeDataPoint({ timestamp: daysAgo(30), searchVolume: 100 }),
        makeDataPoint({ timestamp: daysAgo(15), searchVolume: 60 }),
        makeDataPoint({ timestamp: daysAgo(0), searchVolume: 30 }),
      ];
      const result = calculator.calculateSearchAcceleration(dataPoints);
      expect(result).toBeLessThan(0);
    });

    it('returns 0 when there are insufficient data points', () => {
      expect(calculator.calculateSearchAcceleration([])).toBe(0);
      expect(calculator.calculateSearchAcceleration([makeDataPoint({})])).toBe(0);
    });
  });

  describe('calculateVideoVelocity', () => {
    it('calculates average new videos per day over a window', () => {
      const dataPoints = [
        makeDataPoint({ timestamp: daysAgo(7), videoCount: 0 }),
        makeDataPoint({ timestamp: daysAgo(0), videoCount: 70 }),
      ];
      const result = calculator.calculateVideoVelocity(dataPoints, 7);
      expect(result).toBeCloseTo(10, 1);
    });

    it('returns 0 when insufficient data', () => {
      expect(calculator.calculateVideoVelocity([], 7)).toBe(0);
    });
  });

  describe('calculateCreatorAdoptionRate', () => {
    it('calculates new unique creators per day', () => {
      const dataPoints = [
        makeDataPoint({ timestamp: daysAgo(14), uniqueCreators: 10 }),
        makeDataPoint({ timestamp: daysAgo(0), uniqueCreators: 24 }),
      ];
      const result = calculator.calculateCreatorAdoptionRate(dataPoints, 14);
      expect(result).toBeCloseTo(1, 1);
    });
  });

  describe('determineConfidenceLevel', () => {
    it('returns LOW for fewer than 14 days', () => {
      expect(calculator.determineConfidenceLevel(7)).toBe(ConfidenceLevel.LOW);
    });

    it('returns MEDIUM for 14-29 days', () => {
      expect(calculator.determineConfidenceLevel(14)).toBe(ConfidenceLevel.MEDIUM);
      expect(calculator.determineConfidenceLevel(29)).toBe(ConfidenceLevel.MEDIUM);
    });

    it('returns HIGH for 30+ days', () => {
      expect(calculator.determineConfidenceLevel(30)).toBe(ConfidenceLevel.HIGH);
      expect(calculator.determineConfidenceLevel(90)).toBe(ConfidenceLevel.HIGH);
    });
  });
});
