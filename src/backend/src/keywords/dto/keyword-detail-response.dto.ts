import { Keyword } from '../entities/keyword.entity';
import { PredictionScore } from '../../prediction/entities/prediction-score.entity';
import { AccelerationMetrics } from '../../acceleration/entities/acceleration-metrics.entity';
import { AIInsight } from '../../insights/entities/ai-insight.entity';
import { StageTransitionEvent } from '../../lifecycle/entities/stage-transition-event.entity';
import { LifecycleStage } from '../../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../../common/enums/confidence-level.enum';
import { TimingRecommendation } from '../../common/enums/timing-recommendation.enum';

export class StageTransitionDto {
  id: string;
  previousStage: LifecycleStage;
  newStage: LifecycleStage;
  transitionTimestamp: Date;
  transitionVelocity: string;
  daysInPreviousStage: number;
  accelerationAtTransition: number | null;
  triggerSignals: string[];

  static from(event: StageTransitionEvent): StageTransitionDto {
    const dto = new StageTransitionDto();
    dto.id = event.id;
    dto.previousStage = event.previousStage;
    dto.newStage = event.newStage;
    dto.transitionTimestamp = event.transitionTimestamp;
    dto.transitionVelocity = event.transitionVelocity;
    dto.daysInPreviousStage = event.daysInPreviousStage;
    dto.accelerationAtTransition = event.accelerationAtTransition ?? null;
    dto.triggerSignals = event.triggerSignals ?? [];
    return dto;
  }
}

export class KeywordDetailResponseDto {
  // Core keyword info
  id: string;
  term: string;
  normalizedForm: string;
  lifecycleStage: LifecycleStage;
  monitoringStatus: 'active' | 'paused' | 'failed';
  isSeedKeyword: boolean;
  createdAt: Date;
  lastCollectedAt: Date | null;
  stageEnteredAt: Date;

  // Prediction
  predictionScore: number | null;
  confidenceLevel: ConfidenceLevel | null;
  scoreChange: number | null;
  searchAccelerationComponent: number | null;
  videoVelocityComponent: number | null;
  creatorAdoptionComponent: number | null;

  // Acceleration metrics
  searchAcceleration: number | null;
  videoVelocity: number | null;
  creatorAdoptionRate: number | null;
  viewVelocity: number | null;
  relatedQueryGrowth: number | null;
  historicalDataDays: number | null;

  // AI insight
  insightText: string | null;
  timingRecommendation: TimingRecommendation | null;
  rapidTransitionFlag: boolean;
  seasonalityFlag: boolean;

  // Stage transitions (latest 5)
  stageTransitions: StageTransitionDto[];

  static fromAll(
    keyword: Keyword,
    prediction: PredictionScore | null,
    metrics: AccelerationMetrics | null,
    insight: AIInsight | null,
    transitions: StageTransitionEvent[],
  ): KeywordDetailResponseDto {
    const dto = new KeywordDetailResponseDto();

    dto.id = keyword.id;
    dto.term = keyword.originalTerm;
    dto.normalizedForm = keyword.normalizedForm;
    dto.lifecycleStage = keyword.currentLifecycleStage;
    dto.monitoringStatus = keyword.monitoringStatus;
    dto.isSeedKeyword = keyword.isSeedKeyword;
    dto.createdAt = keyword.createdAt;
    dto.lastCollectedAt = keyword.lastCollectedAt ?? null;
    dto.stageEnteredAt = keyword.stageEnteredAt;

    dto.predictionScore = prediction?.score ?? null;
    dto.confidenceLevel = prediction?.confidenceLevel ?? null;
    dto.scoreChange = (prediction?.scoreChange ?? null) as number | null;
    dto.searchAccelerationComponent = prediction ? Number(prediction.searchAccelerationComponent) : null;
    dto.videoVelocityComponent = prediction ? Number(prediction.videoVelocityComponent) : null;
    dto.creatorAdoptionComponent = prediction ? Number(prediction.creatorAdoptionComponent) : null;

    dto.searchAcceleration = metrics ? Number(metrics.searchAcceleration) : null;
    dto.videoVelocity = metrics ? Number(metrics.videoVelocity) : null;
    dto.creatorAdoptionRate = metrics ? Number(metrics.creatorAdoptionRate) : null;
    dto.viewVelocity = metrics ? Number(metrics.viewVelocity) : null;
    dto.relatedQueryGrowth = metrics ? Number(metrics.relatedQueryGrowth) : null;
    dto.historicalDataDays = metrics?.historicalDataDays ?? null;

    dto.insightText = insight?.insightText ?? null;
    dto.timingRecommendation = (insight?.timingRecommendation ?? null) as TimingRecommendation | null;
    dto.rapidTransitionFlag = insight?.rapidTransitionFlag ?? false;
    dto.seasonalityFlag = insight?.seasonalityFlag ?? false;

    dto.stageTransitions = transitions.slice(0, 5).map(StageTransitionDto.from);

    return dto;
  }
}
