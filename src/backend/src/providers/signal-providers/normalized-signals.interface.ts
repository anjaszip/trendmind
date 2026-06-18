export interface NormalizedSignals {
  searchVolume: number | null;
  videoCount: number | null;
  viewCount: number | null;
  uniqueCreators: number | null;
  engagementRate: number | null;
  relatedQueries: string[];
  breakoutQueries: string[];
  confidence: number;
  collectedAt: Date;
  provider: string;
}
