import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { TimingRecommendation } from '../../common/enums/timing-recommendation.enum';

@Entity('ai_insights')
export class AIInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'keyword_id' })
  keywordId: string;

  @Column({ name: 'insight_text', type: 'text' })
  insightText: string;

  @Column({ name: 'lifecycle_stage_explained', length: 20 })
  lifecycleStageExplained: string;

  @Column({
    name: 'timing_recommendation',
    type: 'enum',
    enum: TimingRecommendation,
    default: TimingRecommendation.EARLY,
  })
  timingRecommendation: TimingRecommendation;

  @Column({ name: 'seasonality_flag', default: false })
  seasonalityFlag: boolean;

  @Column({ name: 'rapid_transition_flag', default: false })
  rapidTransitionFlag: boolean;

  @Column({ name: 'confidence_score', type: 'int', nullable: true })
  confidenceScore: number;

  @Column({ name: 'generation_timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generationTimestamp: Date;

  @Column({ name: 'ai_provider', length: 50 })
  aiProvider: string;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount: number;

  @Column({ name: 'prompt_version', length: 20, nullable: true })
  promptVersion: string;
}
