import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';

@Entity('trend_data_points')
export class TrendDataPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  @Column({ name: 'keyword_id' })
  keywordId: string;

  @Column({ length: 20 })
  provider: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'search_volume', type: 'int', nullable: true })
  searchVolume: number;

  @Column({ name: 'video_count', type: 'int', nullable: true })
  videoCount: number;

  @Column({ name: 'view_count', type: 'bigint', nullable: true })
  viewCount: number;

  @Column({ name: 'unique_creators', type: 'int', nullable: true })
  uniqueCreators: number;

  @Column({ name: 'engagement_rate', type: 'numeric', precision: 5, scale: 4, nullable: true })
  engagementRate: number;

  @Column({ name: 'related_query_breakouts', type: 'int', nullable: true })
  relatedQueryBreakouts: number;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse: Record<string, unknown>;

  @Column({ name: 'collection_status', length: 20, default: 'success' })
  collectionStatus: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
