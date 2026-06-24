import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { LifecycleClassificationJobData } from './queues/lifecycle-classification.queue';
import { LifecycleService } from '../lifecycle/lifecycle.service';

@Processor(QUEUE_NAMES.LIFECYCLE_CLASSIFICATION)
export class LifecycleClassificationProcessor extends WorkerHost {
  private readonly logger = new Logger(LifecycleClassificationProcessor.name);

  constructor(private readonly lifecycleService: LifecycleService) {
    super();
  }

  async process(job: Job<LifecycleClassificationJobData>): Promise<void> {
    const { keywordId } = job.data;
    this.logger.log(`Classifying lifecycle stage for ${keywordId}`);
    const stage = await this.lifecycleService.classifyKeyword(keywordId);
    this.logger.log(`Keyword ${keywordId} classified as: ${stage}`);
  }
}
