import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { InsightGenerationJobData } from './queues/insight-generation.queue';
import { InsightsService } from '../insights/insights.service';

@Processor(QUEUE_NAMES.INSIGHT_GENERATION)
export class InsightGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightGenerationProcessor.name);

  constructor(private readonly insightsService: InsightsService) {
    super();
  }

  async process(job: Job<InsightGenerationJobData>): Promise<void> {
    const { keywordId } = job.data;
    this.logger.log(`Generating insight for ${keywordId}`);
    await this.insightsService.generateInsight(keywordId);
  }
}
