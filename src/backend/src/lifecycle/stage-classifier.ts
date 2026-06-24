import { Injectable } from '@nestjs/common';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { LIFECYCLE_THRESHOLDS } from './config/thresholds.config';

@Injectable()
export class StageClassifier {
  classifyLifecycleStage(metrics: AccelerationMetrics): LifecycleStage {
    const { searchAcceleration, videoVelocity, creatorAdoptionRate } = metrics;
    const t = LIFECYCLE_THRESHOLDS;

    if (searchAcceleration <= t.declining.maxSearchAcceleration) {
      return LifecycleStage.DECLINING;
    }

    if (
      searchAcceleration >= t.viral.minSearchAcceleration &&
      videoVelocity >= t.viral.minVideoVelocity
    ) {
      return LifecycleStage.VIRAL;
    }

    if (
      searchAcceleration >= t.growing.minSearchAcceleration &&
      videoVelocity >= t.growing.minVideoVelocity
    ) {
      return LifecycleStage.GROWING;
    }

    if (
      searchAcceleration >= t.emerging.minSearchAcceleration &&
      videoVelocity >= t.emerging.minVideoVelocity
    ) {
      return LifecycleStage.EMERGING;
    }

    // High search volume with low acceleration = saturated
    if (
      searchAcceleration <= t.saturated.maxSearchAcceleration &&
      (creatorAdoptionRate ?? 0) >= (t.viral.minCreatorAdoptionRate ?? 5)
    ) {
      return LifecycleStage.SATURATED;
    }

    return LifecycleStage.SEED;
  }

  getStageLabel(stage: LifecycleStage): string {
    const labels: Record<LifecycleStage, string> = {
      [LifecycleStage.SEED]: 'Seed',
      [LifecycleStage.EMERGING]: 'Emerging',
      [LifecycleStage.GROWING]: 'Growing',
      [LifecycleStage.VIRAL]: 'Viral',
      [LifecycleStage.SATURATED]: 'Saturated',
      [LifecycleStage.DECLINING]: 'Declining',
    };
    return labels[stage];
  }
}
