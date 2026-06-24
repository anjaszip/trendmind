export interface LifecycleInsightContext {
  keywordId: string;
  keyword: string;
  lifecycleStage: string;
  predictionScore: number;
  accelerationMetrics: {
    searchAcceleration: number | null;
    videoVelocity: number | null;
    creatorAdoptionRate: number | null;
    relatedQueryGrowth: number | null;
  };
  rapidTransition: boolean;
  rapidTransitionDetails?: {
    previousStage: string;
    newStage: string;
    daysInPreviousStage: number;
  };
  seasonalPattern: boolean;
  confidenceLevel: string;
  historicalDataDays: number;
}
