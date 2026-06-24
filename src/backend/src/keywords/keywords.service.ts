import { Injectable, ConflictException, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './entities/keyword.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { TrendCollectionQueue } from '../jobs/queues/trend-collection.queue';

const FORBIDDEN_PATTERNS = [
  /<[^>]*>/,   // HTML tags
  /['"\\;]/,   // SQL injection chars
  /--/,        // SQL comment
  /\/\*/,      // SQL block comment
];

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @Optional() private readonly trendCollectionQueue?: TrendCollectionQueue,
  ) {}

  normalizeKeyword(term: string): string {
    return term
      .replace(/<[^>]*>/g, '')  // strip HTML
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // keep word chars, spaces, hyphens
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

  async listKeywords(userId: string): Promise<Keyword[]> {
    return this.keywordRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getKeyword(userId: string, keywordId: string): Promise<Keyword> {
    const keyword = await this.keywordRepo.findOne({ where: { id: keywordId, userId } });
    if (!keyword) throw new NotFoundException('Keyword not found');
    return keyword;
  }

  async updateMonitoringStatus(keywordId: string, status: 'active' | 'paused' | 'failed'): Promise<void> {
    await this.keywordRepo.update(keywordId, { monitoringStatus: status });
  }
}
