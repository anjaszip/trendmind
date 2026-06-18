export const PREDICTION_WEIGHTS = {
  searchAcceleration: 0.30,
  videoVelocity: 0.25,
  creatorAdoptionRate: 0.20,
  relatedQueryGrowth: 0.15,
  viewVelocity: 0.10,
} as const;

export type PredictionWeightKey = keyof typeof PREDICTION_WEIGHTS;
