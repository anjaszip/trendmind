import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LifecycleStage } from '../../common/enums/lifecycle-stage.enum';

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'original_term', length: 100 })
  originalTerm: string;

  @Column({ name: 'normalized_form', length: 100 })
  normalizedForm: string;

  @Column({
    name: 'current_lifecycle_stage',
    type: 'enum',
    enum: LifecycleStage,
    default: LifecycleStage.SEED,
  })
  currentLifecycleStage: LifecycleStage;

  @Column({ name: 'stage_entered_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  stageEnteredAt: Date;

  @Column({ name: 'is_seed_keyword', default: false })
  isSeedKeyword: boolean;

  @Column({
    name: 'monitoring_status',
    type: 'enum',
    enum: ['active', 'paused', 'failed'],
    default: 'active',
  })
  monitoringStatus: 'active' | 'paused' | 'failed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_collected_at', type: 'timestamp', nullable: true })
  lastCollectedAt: Date;

  @OneToMany('TrendDataPoint', 'keyword')
  trendDataPoints: unknown[];

  @OneToMany('AccelerationMetrics', 'keyword')
  accelerationMetrics: unknown[];

  @OneToMany('PredictionScore', 'keyword')
  predictionScores: unknown[];

  @OneToMany('AIInsight', 'keyword')
  aiInsights: unknown[];

  @OneToMany('StageTransitionEvent', 'keyword')
  stageTransitionEvents: unknown[];
}
