import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { PredictionScoringJobData } from './queues/prediction-scoring.queue';
import { LifecycleClassificationQueue } from './queues/lifecycle-classification.queue';
import { InsightGenerationQueue } from './queues/insight-generation.queue';
import { PredictionService } from '../prediction/prediction.service';

@Processor(QUEUE_NAMES.PREDICTION_SCORING)
export class PredictionScoringProcessor extends WorkerHost {
  private readonly logger = new Logger(PredictionScoringProcessor.name);

  constructor(
    private readonly predictionService: PredictionService,
    private readonly lifecycleQueue: LifecycleClassificationQueue,
    private readonly insightQueue: InsightGenerationQueue,
  ) {
    super();
  }

  async process(job: Job<PredictionScoringJobData>): Promise<void> {
    const { keywordId } = job.data;
    this.logger.log(`Scoring prediction for ${keywordId}`);

    await this.predictionService.scorePrediction(keywordId);

    await Promise.all([
      this.lifecycleQueue.add({ keywordId }),
      this.insightQueue.add({ keywordId }),
    ]);
  }
}
