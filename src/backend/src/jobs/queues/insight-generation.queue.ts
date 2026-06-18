import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/config/bullmq.config';

export interface InsightGenerationJobData {
  keywordId: string;
}

@Injectable()
export class InsightGenerationQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.INSIGHT_GENERATION)
    private readonly queue: Queue<InsightGenerationJobData>,
  ) {}

  async add(data: InsightGenerationJobData): Promise<void> {
    await this.queue.add('generate', data, {
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
