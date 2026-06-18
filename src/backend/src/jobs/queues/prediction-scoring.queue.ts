import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/config/bullmq.config';

export interface PredictionScoringJobData {
  keywordId: string;
}

@Injectable()
export class PredictionScoringQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.PREDICTION_SCORING)
    private readonly queue: Queue<PredictionScoringJobData>,
  ) {}

  async add(data: PredictionScoringJobData): Promise<void> {
    await this.queue.add('score', data, {
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
