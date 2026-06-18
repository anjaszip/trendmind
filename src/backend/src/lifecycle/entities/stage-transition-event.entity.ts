import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { LifecycleStage } from '../../common/enums/lifecycle-stage.enum';

@Entity('stage_transition_events')
export class StageTransitionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'keyword_id' })
  keywordId: string;

  @Column({
    name: 'previous_stage',
    type: 'enum',
    enum: LifecycleStage,
  })
  previousStage: LifecycleStage;

  @Column({
    name: 'new_stage',
    type: 'enum',
    enum: LifecycleStage,
  })
  newStage: LifecycleStage;

  @Column({ name: 'transition_timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transitionTimestamp: Date;

  @Column({ name: 'trigger_signals', type: 'text', array: true })
  triggerSignals: string[];

  @Column({ name: 'transition_velocity', length: 10 })
  transitionVelocity: string;

  @Column({ name: 'days_in_previous_stage', type: 'int' })
  daysInPreviousStage: number;

  @Column({ name: 'acceleration_at_transition', type: 'numeric', nullable: true })
  accelerationAtTransition: number;
}
