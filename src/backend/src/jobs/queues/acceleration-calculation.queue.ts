import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/config/bullmq.config';

export interface AccelerationJobData {
  keywordId: string;
}

@Injectable()
export class AccelerationCalculationQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.ACCELERATION_CALCULATION)
    private readonly queue: Queue<AccelerationJobData>,
  ) {}

  async add(data: AccelerationJobData): Promise<void> {
    await this.queue.add('calculate', data, {
      attempts: 2,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
