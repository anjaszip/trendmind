import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/config/bullmq.config';

export interface TrendCollectionJobData {
  keywordId: string;
  keyword: string;
  providers: string[];
}

@Injectable()
export class TrendCollectionQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.TREND_COLLECTION)
    private readonly queue: Queue<TrendCollectionJobData>,
  ) {}

  async add(data: TrendCollectionJobData, delayMs?: number): Promise<void> {
    await this.queue.add('collect', data, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async addBulk(jobs: TrendCollectionJobData[]): Promise<void> {
    await this.queue.addBulk(
      jobs.map((data, i) => ({
        name: 'collect',
        data,
        opts: { delay: i * 3000, attempts: 3, backoff: { type: 'exponential' as const, delay: 5000 } },
      })),
    );
  }
}
