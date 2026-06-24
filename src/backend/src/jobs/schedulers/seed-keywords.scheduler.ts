import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { TrendCollectionQueue } from '../queues/trend-collection.queue';

const COLLECTION_INTERVAL_HOURS = 1;
const STAGGER_INTERVAL_MS = (COLLECTION_INTERVAL_HOURS * 3600 * 1000);

@Injectable()
export class SeedKeywordsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedKeywordsScheduler.name);

  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    private readonly trendCollectionQueue: TrendCollectionQueue,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.scheduleSeedKeywords();
  }

  async scheduleSeedKeywords(): Promise<void> {
    const seeds = await this.keywordRepo.find({
      where: { isSeedKeyword: true, monitoringStatus: 'active' },
    });

    if (seeds.length === 0) {
      this.logger.warn('No seed keywords found. Run migration 20260604000002-SeedKeywords first.');
      return;
    }

    const delayPerKeyword = Math.floor(STAGGER_INTERVAL_MS / seeds.length);

    const jobs = seeds.map((kw, i) => ({
      keywordId: kw.id,
      keyword: kw.originalTerm,
      providers: ['google_trends', 'youtube'],
      delayMs: i * delayPerKeyword,
    }));

    for (const job of jobs) {
      await this.trendCollectionQueue.add(
        { keywordId: job.keywordId, keyword: job.keyword, providers: job.providers },
        job.delayMs,
      );
    }

    this.logger.log(
      `Scheduled ${seeds.length} seed keywords with ${delayPerKeyword}ms stagger (${COLLECTION_INTERVAL_HOURS}h window)`,
    );
  }
}
