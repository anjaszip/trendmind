import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../common/config/bullmq.config';
import { TrendCollectionJobData } from './queues/trend-collection.queue';
import { AccelerationCalculationQueue } from './queues/acceleration-calculation.queue';
import { TrendDataPoint } from '../trends/entities/trend-data-point.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { GoogleTrendsProvider } from '../providers/signal-providers/google-trends.provider';
import { YouTubeProvider } from '../providers/signal-providers/youtube.provider';
import { NormalizedSignals } from '../providers/signal-providers/normalized-signals.interface';

const MAX_ATTEMPTS = 3;

@Processor(QUEUE_NAMES.TREND_COLLECTION)
export class TrendCollectionProcessor extends WorkerHost {
  private readonly logger = new Logger(TrendCollectionProcessor.name);

  constructor(
    @InjectRepository(TrendDataPoint)
    private readonly trendRepo: Repository<TrendDataPoint>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    private readonly googleTrendsProvider: GoogleTrendsProvider,
    private readonly youTubeProvider: YouTubeProvider,
    private readonly accelerationQueue: AccelerationCalculationQueue,
  ) {
    super();
  }

  async process(job: Job<TrendCollectionJobData>): Promise<void> {
    const { keywordId, keyword, providers } = job.data;
    this.logger.log(`Collecting signals for "${keyword}" (attempt ${job.attemptsMade + 1}/${MAX_ATTEMPTS})`);

    const collectedProviders = providers.length > 0 ? providers : ['google_trends', 'youtube'];
    const signals: Array<{ provider: string; data: NormalizedSignals }> = [];

    for (const providerName of collectedProviders) {
      try {
        const provider = providerName === 'google_trends' ? this.googleTrendsProvider : this.youTubeProvider;
        const data = await provider.collectSignals(keyword);
        signals.push({ provider: providerName, data });
      } catch (err) {
        this.logger.warn(`Provider ${providerName} failed for "${keyword}": ${err}`);
      }
    }

    if (signals.length === 0) {
      const isFinalAttempt = job.attemptsMade + 1 >= MAX_ATTEMPTS;
      if (isFinalAttempt) {
        this.logger.error(`All ${MAX_ATTEMPTS} attempts failed for "${keyword}" — marking as failed`);
        await this.keywordRepo.update(keywordId, { monitoringStatus: 'failed' });
      } else {
        // BullMQ will retry with exponential backoff defined in the queue
        throw new Error(`No signals collected for "${keyword}" on attempt ${job.attemptsMade + 1}`);
      }
      return;
    }

    const dataPoints = signals.map(({ provider, data }) =>
      this.trendRepo.create({
        keywordId,
        provider,
        timestamp: data.collectedAt,
        searchVolume: data.searchVolume ?? undefined,
        videoCount: data.videoCount ?? undefined,
        viewCount: data.viewCount ?? undefined,
        uniqueCreators: data.uniqueCreators ?? undefined,
        engagementRate: data.engagementRate ?? undefined,
        collectionStatus: 'success',
      }),
    );

    await this.trendRepo.save(dataPoints);
    await this.keywordRepo.update(keywordId, { lastCollectedAt: new Date(), monitoringStatus: 'active' });
    await this.accelerationQueue.add({ keywordId });
    this.logger.log(`Saved ${dataPoints.length} data points for "${keyword}"`);
  }
}
