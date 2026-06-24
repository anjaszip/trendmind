import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictionScore } from './entities/prediction-score.entity';
import { PercentileService } from './percentile.service';
import { ScoringService } from './scoring.service';
import { AccelerationService } from '../acceleration/acceleration.service';

@Injectable()
export class PredictionService {
  constructor(
    @InjectRepository(PredictionScore)
    private readonly predictionRepo: Repository<PredictionScore>,
    private readonly percentileService: PercentileService,
    private readonly scoringService: ScoringService,
    private readonly accelerationService: AccelerationService,
  ) {}

  async scorePrediction(keywordId: string): Promise<PredictionScore> {
    const ranks = await this.percentileService.calculatePercentileRanks(keywordId);
    const components = this.scoringService.applyWeights(ranks);
    const score = this.scoringService.calculateWeightedScore(ranks);

    const metrics = await this.accelerationService.getLatestMetrics(keywordId);

    const previous = await this.predictionRepo.findOne({
      where: { keywordId },
      order: { calculationTimestamp: 'DESC' },
    });

    const entity = this.predictionRepo.create({
      keywordId,
      score,
      confidenceLevel: metrics?.confidenceLevel,
      searchAccelerationComponent: components.searchAccelerationComponent,
      videoVelocityComponent: components.videoVelocityComponent,
      creatorAdoptionComponent: components.creatorAdoptionComponent,
      relatedQueryGrowthComponent: components.relatedQueryGrowthComponent,
      viewVelocityComponent: components.viewVelocityComponent,
      previousScore: previous?.score ?? undefined,
      scoreChange: previous != null ? score - previous.score : undefined,
      calculationTimestamp: new Date(),
    });

    return this.predictionRepo.save(entity);
  }

  async getLatestScore(keywordId: string): Promise<PredictionScore | null> {
    return this.predictionRepo.findOne({
      where: { keywordId },
      order: { calculationTimestamp: 'DESC' },
    });
  }

  async getPredictionHistory(keywordId: string, days = 30): Promise<PredictionScore[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.predictionRepo
      .createQueryBuilder('ps')
      .where('ps.keywordId = :keywordId', { keywordId })
      .andWhere('ps.calculationTimestamp >= :since', { since })
      .orderBy('ps.calculationTimestamp', 'ASC')
      .getMany();
  }
}
