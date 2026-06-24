import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StageTransitionEvent } from './entities/stage-transition-event.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { Keyword } from '../keywords/entities/keyword.entity';

interface LogTransitionInput {
  keywordId: string;
  previousStage: LifecycleStage;
  newStage: LifecycleStage;
  accelerationAtTransition?: number;
}

@Injectable()
export class StageTransitionService {
  constructor(
    @InjectRepository(StageTransitionEvent)
    private readonly transitionRepo: Repository<StageTransitionEvent>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
  ) {}

  async logTransition(input: LogTransitionInput): Promise<StageTransitionEvent> {
    const keyword = await this.keywordRepo.findOneByOrFail({ id: input.keywordId });
    const daysInPreviousStage = this.calcDaysInStage(keyword.stageEnteredAt);
    const velocity = this.classifyVelocity(daysInPreviousStage);

    const event = this.transitionRepo.create({
      keywordId: input.keywordId,
      previousStage: input.previousStage,
      newStage: input.newStage,
      transitionVelocity: velocity,
      daysInPreviousStage,
      accelerationAtTransition: input.accelerationAtTransition ?? undefined,
      triggerSignals: this.buildTriggerSignals(input),
    });

    return this.transitionRepo.save(event);
  }

  detectRapidTransition(daysInPreviousStage: number): boolean {
    return daysInPreviousStage < 7;
  }

  async getTransitionHistory(keywordId: string): Promise<StageTransitionEvent[]> {
    return this.transitionRepo.find({
      where: { keywordId },
      order: { transitionTimestamp: 'DESC' },
    });
  }

  private calcDaysInStage(enteredAt: Date): number {
    const msPerDay = 86_400_000;
    return Math.floor((Date.now() - enteredAt.getTime()) / msPerDay);
  }

  private classifyVelocity(days: number): string {
    if (days < 7) return 'rapid';
    if (days <= 14) return 'normal';
    return 'stagnant';
  }

  private buildTriggerSignals(input: LogTransitionInput): string[] {
    const signals: string[] = [`stage_change:${input.previousStage}->${input.newStage}`];
    if (input.accelerationAtTransition != null) {
      signals.push(`search_acceleration:${input.accelerationAtTransition.toFixed(3)}`);
    }
    return signals;
  }
}
