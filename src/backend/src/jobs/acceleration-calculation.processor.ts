import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { AccelerationJobData } from './queues/acceleration-calculation.queue';
import { PredictionScoringQueue } from './queues/prediction-scoring.queue';
import { AccelerationService } from '../acceleration/acceleration.service';

@Processor(QUEUE_NAMES.ACCELERATION_CALCULATION)
export class AccelerationCalculationProcessor extends WorkerHost {
  private readonly logger = new Logger(AccelerationCalculationProcessor.name);

  constructor(
    private readonly accelerationService: AccelerationService,
    private readonly predictionScoringQueue: PredictionScoringQueue,
  ) {
    super();
  }

  async process(job: Job<AccelerationJobData>): Promise<void> {
    const { keywordId } = job.data;
    this.logger.log(`Calculating acceleration metrics for ${keywordId}`);

    await this.accelerationService.calculateMetrics(keywordId);
    await this.predictionScoringQueue.add({ keywordId });
  }
}
