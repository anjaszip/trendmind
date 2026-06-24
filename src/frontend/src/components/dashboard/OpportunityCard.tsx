'use client';

import Link from 'next/link';
import styles from './OpportunityCard.module.css';

export interface Opportunity {
  keywordId: string;
  keyword: string;
  lifecycleStage: string;
  predictionScore: number;
  confidenceLevel: string;
  searchAcceleration: number | null;
  videoVelocity: number | null;
  creatorAdoptionRate: number | null;
  insightText: string | null;
  timingRecommendation: string | null;
  rapidTransitionFlag: boolean;
  scoreChange: number | null;
}

const STAGE_CLASS: Record<string, string> = {
  seed: styles.stageSeed,
  emerging: styles.stageEmerging,
  growing: styles.stageGrowing,
  viral: styles.stageViral,
  saturated: styles.stageSaturated,
  declining: styles.stageDeclining,
};

const TIMING_CLASS: Record<string, string> = {
  early: styles.timingEarly,
  on_time: styles.timingOnTime,
  late: styles.timingLate,
  avoid: styles.timingAvoid,
};

function fmt(value: number | null, decimals = 2): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

interface Props {
  opportunity: Opportunity;
  onClick?: (keywordId: string) => void;
}

export function OpportunityCard({ opportunity: op, onClick }: Props) {
  const stageClass = STAGE_CLASS[op.lifecycleStage] ?? styles.stageSeed;
  const timingClass = op.timingRecommendation ? (TIMING_CLASS[op.timingRecommendation] ?? '') : '';
  const scoreChangePositive = (op.scoreChange ?? 0) > 0;
  const isInsufficientData = op.confidenceLevel === 'low' && op.predictionScore === 0;

  return (
    <div className={styles.card} role="article">
      <div className={styles.header}>
        <Link href={`/keyword/${op.keywordId}`} className={styles.keyword} title={op.keyword} onClick={() => onClick?.(op.keywordId)}>
          {op.keyword}
        </Link>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span className={styles.score}>{op.predictionScore}</span>
          <span className={styles.scoreLabel}>score</span>
          {op.scoreChange != null && op.scoreChange !== 0 && (
            <span className={`${styles.scoreChange} ${scoreChangePositive ? styles.scoreChangeUp : styles.scoreChangeDown}`}>
              {scoreChangePositive ? '+' : ''}{op.scoreChange}
            </span>
          )}
        </div>
      </div>

      <div className={styles.badges}>
        <span className={`${styles.stageBadge} ${stageClass}`}>{op.lifecycleStage}</span>
        <span className={styles.confidenceBadge}>{op.confidenceLevel}</span>
        {op.timingRecommendation && (
          <span className={`${styles.timingBadge} ${timingClass}`}>{op.timingRecommendation.replace('_', ' ')}</span>
        )}
      </div>

      {op.rapidTransitionFlag && (
        <div className={styles.rapidAlert}>
          ⚠ Rapid stage transition detected
        </div>
      )}

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{fmt(op.searchAcceleration)}</div>
          <div className={styles.metricLabel}>Search accel</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{fmt(op.videoVelocity, 1)}</div>
          <div className={styles.metricLabel}>Videos/day</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricValue}>{fmt(op.creatorAdoptionRate, 1)}</div>
          <div className={styles.metricLabel}>Creators/day</div>
        </div>
      </div>

      {isInsufficientData && (
        <p className={styles.insufficientData}>
          Insufficient historical data for high-confidence prediction. Check back in 7–14 days.
        </p>
      )}

      {!isInsufficientData && op.insightText && (
        <p className={styles.insight}>{op.insightText}</p>
      )}
    </div>
  );
}
