import { NormalizedSignals } from './normalized-signals.interface';

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

export interface ISignalProvider {
  readonly providerName: string;

  collectSignals(keyword: string): Promise<NormalizedSignals>;

  normalizeSignals(rawData: unknown): NormalizedSignals;

  getRateLimitStatus(): RateLimitStatus;
}

export const SIGNAL_PROVIDER = Symbol('ISignalProvider');
