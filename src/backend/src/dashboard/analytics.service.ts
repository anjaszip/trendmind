import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { StageTransitionEvent } from '../lifecycle/entities/stage-transition-event.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';

export interface StageDistribution {
  stage: LifecycleStage;
  count: number;
  percentage: number;
}

export interface RapidTransition {
  keywordId: string;
  keyword: string;
  previousStage: LifecycleStage;
  newStage: LifecycleStage;
  transitionTimestamp: Date;
  daysInPreviousStage: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(StageTransitionEvent)
    private readonly transitionRepo: Repository<StageTransitionEvent>,
  ) {}

  async getStageDistribution(): Promise<StageDistribution[]> {
    const counts = await this.keywordRepo
      .createQueryBuilder('k')
      .select('k.currentLifecycleStage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .where('k.monitoringStatus = :status', { status: 'active' })
      .groupBy('k.currentLifecycleStage')
      .getRawMany<{ stage: LifecycleStage; count: string }>();

    const total = counts.reduce((sum, c) => sum + Number(c.count), 0);

    return counts.map((c) => ({
      stage: c.stage,
      count: Number(c.count),
      percentage: total > 0 ? Math.round((Number(c.count) / total) * 100) : 0,
    }));
  }

  async getRapidTransitions(days = 7): Promise<RapidTransition[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const transitions = await this.transitionRepo
      .createQueryBuilder('t')
      .innerJoinAndSelect(Keyword, 'k', 'k.id = t.keywordId')
      .where('t.transitionTimestamp >= :since', { since })
      .andWhere('t.transitionVelocity = :velocity', { velocity: 'rapid' })
      .orderBy('t.transitionTimestamp', 'DESC')
      .limit(20)
      .getRawMany<{
        t_keyword_id: string;
        k_original_term: string;
        t_previous_stage: LifecycleStage;
        t_new_stage: LifecycleStage;
        t_transition_timestamp: Date;
        t_days_in_previous_stage: number;
      }>();

    return transitions.map((t) => ({
      keywordId: t.t_keyword_id,
      keyword: t.k_original_term,
      previousStage: t.t_previous_stage,
      newStage: t.t_new_stage,
      transitionTimestamp: t.t_transition_timestamp,
      daysInPreviousStage: Number(t.t_days_in_previous_stage),
    }));
  }
}
