import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/config/bullmq.config';

export interface LifecycleClassificationJobData {
  keywordId: string;
}

@Injectable()
export class LifecycleClassificationQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.LIFECYCLE_CLASSIFICATION)
    private readonly queue: Queue<LifecycleClassificationJobData>,
  ) {}

  async add(data: LifecycleClassificationJobData): Promise<void> {
    await this.queue.add('classify', data, {
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
