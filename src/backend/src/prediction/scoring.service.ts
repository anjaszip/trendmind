import { Injectable } from '@nestjs/common';
import { PREDICTION_WEIGHTS } from './config/weights.config';
import { PercentileRanks } from './percentile.service';

export interface ScoreComponents {
  searchAccelerationComponent: number;
  videoVelocityComponent: number;
  creatorAdoptionComponent: number;
  relatedQueryGrowthComponent: number;
  viewVelocityComponent: number;
}

@Injectable()
export class ScoringService {
  calculateWeightedScore(ranks: PercentileRanks): number {
    const components = this.applyWeights(ranks);
    const raw =
      components.searchAccelerationComponent +
      components.videoVelocityComponent +
      components.creatorAdoptionComponent +
      components.relatedQueryGrowthComponent +
      components.viewVelocityComponent;
    return Math.round(Math.min(100, Math.max(0, raw)));
  }

  applyWeights(ranks: PercentileRanks): ScoreComponents {
    return {
      searchAccelerationComponent: ranks.searchAcceleration * PREDICTION_WEIGHTS.searchAcceleration,
      videoVelocityComponent: ranks.videoVelocity * PREDICTION_WEIGHTS.videoVelocity,
      creatorAdoptionComponent: ranks.creatorAdoptionRate * PREDICTION_WEIGHTS.creatorAdoptionRate,
      relatedQueryGrowthComponent: ranks.relatedQueryGrowth * PREDICTION_WEIGHTS.relatedQueryGrowth,
      viewVelocityComponent: ranks.viewVelocity * PREDICTION_WEIGHTS.viewVelocity,
    };
  }
}
