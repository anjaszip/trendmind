import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { StageClassifier } from './stage-classifier';
import { StageTransitionService } from './stage-transition.service';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(AccelerationMetrics)
    private readonly metricsRepo: Repository<AccelerationMetrics>,
    private readonly classifier: StageClassifier,
    private readonly transitionService: StageTransitionService,
  ) {}

  async classifyKeyword(keywordId: string): Promise<LifecycleStage> {
    const metrics = await this.metricsRepo.findOne({
      where: { keywordId },
      order: { calculationTimestamp: 'DESC' },
    });

    if (!metrics) {
      return LifecycleStage.SEED;
    }

    const newStage = this.classifier.classifyLifecycleStage(metrics);
    const keyword = await this.keywordRepo.findOneByOrFail({ id: keywordId });
    const previousStage = keyword.currentLifecycleStage;

    if (previousStage !== newStage) {
      await this.transitionService.logTransition({
        keywordId,
        previousStage,
        newStage,
        accelerationAtTransition: metrics.searchAcceleration,
      });

      await this.keywordRepo.update(keywordId, {
        currentLifecycleStage: newStage,
        stageEnteredAt: new Date(),
      });

      this.logger.log(`Keyword ${keywordId}: ${previousStage} → ${newStage}`);
    }

    return newStage;
  }

  async detectStageTransition(keywordId: string): Promise<boolean> {
    const keyword = await this.keywordRepo.findOneByOrFail({ id: keywordId });
    const metrics = await this.metricsRepo.findOne({
      where: { keywordId },
      order: { calculationTimestamp: 'DESC' },
    });

    if (!metrics) return false;

    const newStage = this.classifier.classifyLifecycleStage(metrics);
    return keyword.currentLifecycleStage !== newStage;
  }
}
