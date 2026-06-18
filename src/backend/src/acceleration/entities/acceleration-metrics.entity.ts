import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { ConfidenceLevel } from '../../common/enums/confidence-level.enum';

@Entity('acceleration_metrics')
export class AccelerationMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'keyword_id' })
  keywordId: string;

  @Column({ name: 'calculation_timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculationTimestamp: Date;

  @Column({ name: 'search_acceleration', type: 'numeric', nullable: true })
  searchAcceleration: number;

  @Column({ name: 'search_acceleration_7d', type: 'numeric', nullable: true })
  searchAcceleration7d: number;

  @Column({ name: 'search_acceleration_30d', type: 'numeric', nullable: true })
  searchAcceleration30d: number;

  @Column({ name: 'video_velocity', type: 'numeric', nullable: true })
  videoVelocity: number;

  @Column({ name: 'view_velocity', type: 'numeric', nullable: true })
  viewVelocity: number;

  @Column({ name: 'creator_adoption_rate', type: 'numeric', nullable: true })
  creatorAdoptionRate: number;

  @Column({ name: 'related_query_growth', type: 'numeric', nullable: true })
  relatedQueryGrowth: number;

  @Column({
    name: 'confidence_level',
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.LOW,
  })
  confidenceLevel: ConfidenceLevel;

  @Column({ name: 'historical_data_days', type: 'int', default: 0 })
  historicalDataDays: number;
}
