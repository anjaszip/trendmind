import { StageClassifier } from './stage-classifier';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';

function makeMetrics(overrides: Partial<AccelerationMetrics>): AccelerationMetrics {
  const m = new AccelerationMetrics();
  m.searchAcceleration = 0;
  m.videoVelocity = 0;
  m.creatorAdoptionRate = 0;
  m.viewVelocity = 0;
  m.relatedQueryGrowth = 0;
  m.confidenceLevel = ConfidenceLevel.LOW;
  m.historicalDataDays = 5;
  return Object.assign(m, overrides);
}

describe('StageClassifier', () => {
  let classifier: StageClassifier;

  beforeEach(() => {
    classifier = new StageClassifier();
  });

  describe('classifyLifecycleStage', () => {
    it('classifies SEED when all signals are near zero', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.01, videoVelocity: 0.5, creatorAdoptionRate: 0.1 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.SEED);
    });

    it('classifies EMERGING when search acceleration is between 0.05 and 0.30', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.15, videoVelocity: 5, creatorAdoptionRate: 0.8 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.EMERGING);
    });

    it('classifies GROWING when search acceleration is between 0.30 and 1.0', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.6, videoVelocity: 25, creatorAdoptionRate: 2 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.GROWING);
    });

    it('classifies VIRAL when search acceleration exceeds 1.0 and video velocity exceeds 50', () => {
      const metrics = makeMetrics({ searchAcceleration: 1.5, videoVelocity: 80, creatorAdoptionRate: 8 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.VIRAL);
    });

    it('classifies DECLINING when search acceleration is strongly negative', () => {
      const metrics = makeMetrics({ searchAcceleration: -0.1, videoVelocity: 2, creatorAdoptionRate: 0 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.DECLINING);
    });

    it('classifies SEED when acceleration is exactly at seed threshold boundary', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.04, videoVelocity: 0.9 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.SEED);
    });

    it('classifies EMERGING when acceleration is exactly at emerging lower boundary', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.05, videoVelocity: 1 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.EMERGING);
    });

    it('classifies GROWING when acceleration is exactly at growing lower boundary', () => {
      const metrics = makeMetrics({ searchAcceleration: 0.30, videoVelocity: 10 });
      expect(classifier.classifyLifecycleStage(metrics)).toBe(LifecycleStage.GROWING);
    });
  });

  describe('getStageLabel', () => {
    it('returns human-readable labels for all stages', () => {
      expect(classifier.getStageLabel(LifecycleStage.SEED)).toBe('Seed');
      expect(classifier.getStageLabel(LifecycleStage.EMERGING)).toBe('Emerging');
      expect(classifier.getStageLabel(LifecycleStage.GROWING)).toBe('Growing');
      expect(classifier.getStageLabel(LifecycleStage.VIRAL)).toBe('Viral');
      expect(classifier.getStageLabel(LifecycleStage.SATURATED)).toBe('Saturated');
      expect(classifier.getStageLabel(LifecycleStage.DECLINING)).toBe('Declining');
    });
  });
});
