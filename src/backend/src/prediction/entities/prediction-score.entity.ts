import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { ConfidenceLevel } from '../../common/enums/confidence-level.enum';

@Entity('prediction_scores')
export class PredictionScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'keyword_id' })
  keywordId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ name: 'calculation_timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculationTimestamp: Date;

  @Column({ name: 'search_acceleration_component', type: 'numeric' })
  searchAccelerationComponent: number;

  @Column({ name: 'video_velocity_component', type: 'numeric' })
  videoVelocityComponent: number;

  @Column({ name: 'creator_adoption_component', type: 'numeric' })
  creatorAdoptionComponent: number;

  @Column({ name: 'related_query_growth_component', type: 'numeric' })
  relatedQueryGrowthComponent: number;

  @Column({ name: 'view_velocity_component', type: 'numeric' })
  viewVelocityComponent: number;

  @Column({
    name: 'confidence_level',
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.LOW,
  })
  confidenceLevel: ConfidenceLevel;

  @Column({ name: 'previous_score', type: 'int', nullable: true })
  previousScore: number;

  @Column({ name: 'score_change', type: 'int', nullable: true })
  scoreChange: number;
}
