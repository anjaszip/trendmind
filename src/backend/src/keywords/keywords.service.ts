import { Injectable, ConflictException, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './entities/keyword.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { TrendCollectionQueue } from '../jobs/queues/trend-collection.queue';
import { AccelerationService } from '../acceleration/acceleration.service';
import { PredictionService } from '../prediction/prediction.service';
import { InsightsService } from '../insights/insights.service';
import { StageTransitionService } from '../lifecycle/stage-transition.service';
import { KeywordDetailResponseDto } from './dto/keyword-detail-response.dto';
import { KeywordResponseDto } from './dto/keyword-response.dto';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { StageTransitionEvent } from '../lifecycle/entities/stage-transition-event.entity';

const FORBIDDEN_PATTERNS = [
  /<[^>]*>/,
  /['"\\;]/,
  /--/,
  /\/\*/,
];

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @Optional() private readonly trendCollectionQueue?: TrendCollectionQueue,
    @Optional() private readonly accelerationService?: AccelerationService,
    @Optional() private readonly predictionService?: PredictionService,
    @Optional() private readonly insightsService?: InsightsService,
    @Optional() private readonly transitionService?: StageTransitionService,
  ) {}

  normalizeKeyword(term: string): string {
    return term
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');
  }

  validateKeyword(term: string): void {
    if (!term || term.trim().length === 0) {
      throw new BadRequestException('Keyword must not be empty');
    }
    if (term.length > 100) {
      throw new BadRequestException('Keyword must not exceed 100 characters');
    }
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(term)) {
        throw new BadRequestException('Keyword contains invalid characters');
      }
    }
  }

  async addKeyword(userId: string, term: string): Promise<Keyword> {
    this.validateKeyword(term);
    const normalizedForm = this.normalizeKeyword(term);

    if (!normalizedForm) {
      throw new BadRequestException('Keyword is invalid after normalization');
    }

    const existing = await this.keywordRepo.findOne({ where: { userId, normalizedForm } });
    if (existing) {
      throw new ConflictException(`You are already monitoring "${existing.originalTerm}"`);
    }

    const keyword = this.keywordRepo.create({
      userId,
      originalTerm: term.trim(),
      normalizedForm,
      currentLifecycleStage: LifecycleStage.SEED,
      stageEnteredAt: new Date(),
      isSeedKeyword: false,
      monitoringStatus: 'active',
    });

    const saved = await this.keywordRepo.save(keyword);

    await this.trendCollectionQueue?.add({
      keywordId: saved.id,
      keyword: saved.originalTerm,
      providers: ['google_trends', 'youtube'],
    });

    return saved;
  }

  async removeKeyword(userId: string, keywordId: string): Promise<void> {
    const keyword = await this.keywordRepo.findOne({ where: { id: keywordId, userId } });
    if (!keyword) throw new NotFoundException('Keyword not found');
    if (keyword.isSeedKeyword) throw new BadRequestException('Seed keywords cannot be removed');
    await this.keywordRepo.remove(keyword);
  }

  async listKeywords(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: KeywordResponseDto[]; total: number; page: number; limit: number }> {
    const [keywords, total] = await this.keywordRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: keywords.map(KeywordResponseDto.from), total, page, limit };
  }

  async getKeyword(userId: string, keywordId: string): Promise<Keyword> {
    const keyword = await this.keywordRepo.findOne({ where: { id: keywordId, userId } });
    if (!keyword) throw new NotFoundException('Keyword not found');
    return keyword;
  }

  async getKeywordDetail(userId: string, keywordId: string): Promise<KeywordDetailResponseDto> {
    const keyword = await this.getKeyword(userId, keywordId);

    const [prediction, metrics, insight, transitions] = await Promise.all([
      this.predictionService ? this.predictionService.getLatestScore(keywordId) : Promise.resolve(null),
      this.accelerationService ? this.accelerationService.getLatestMetrics(keywordId) : Promise.resolve(null),
      this.insightsService ? this.insightsService.getLatestInsight(keywordId) : Promise.resolve(null),
      this.transitionService ? this.transitionService.getTransitionHistory(keywordId) : Promise.resolve([]),
    ]);

    return KeywordDetailResponseDto.fromAll(keyword, prediction, metrics, insight, transitions);
  }

  async getAccelerationHistory(userId: string, keywordId: string, days = 30): Promise<AccelerationMetrics[]> {
    await this.getKeyword(userId, keywordId);
    return this.accelerationService
      ? this.accelerationService.getAccelerationHistory(keywordId, days)
      : Promise.resolve([]);
  }

  async getStageTransitions(userId: string, keywordId: string): Promise<StageTransitionEvent[]> {
    await this.getKeyword(userId, keywordId);
    return this.transitionService
      ? this.transitionService.getTransitionHistory(keywordId)
      : Promise.resolve([]);
  }

  async updateMonitoringStatus(keywordId: string, status: 'active' | 'paused' | 'failed'): Promise<void> {
    await this.keywordRepo.update(keywordId, { monitoringStatus: status });
  }
}
