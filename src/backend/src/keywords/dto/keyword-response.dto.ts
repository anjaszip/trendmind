import { Keyword } from '../entities/keyword.entity';
import { LifecycleStage } from '../../common/enums/lifecycle-stage.enum';

export class KeywordResponseDto {
  id: string;
  term: string;
  normalizedForm: string;
  lifecycleStage: LifecycleStage;
  monitoringStatus: 'active' | 'paused' | 'failed';
  isSeedKeyword: boolean;
  createdAt: Date;
  lastCollectedAt: Date | null;

  static from(keyword: Keyword): KeywordResponseDto {
    const dto = new KeywordResponseDto();
    dto.id = keyword.id;
    dto.term = keyword.originalTerm;
    dto.normalizedForm = keyword.normalizedForm;
    dto.lifecycleStage = keyword.currentLifecycleStage;
    dto.monitoringStatus = keyword.monitoringStatus;
    dto.isSeedKeyword = keyword.isSeedKeyword;
    dto.createdAt = keyword.createdAt;
    dto.lastCollectedAt = keyword.lastCollectedAt ?? null;
    return dto;
  }
}
