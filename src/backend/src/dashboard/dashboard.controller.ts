import { Controller, Get, Query, UseGuards, ParseIntPipe, ParseEnumPipe, DefaultValuePipe, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmergingOpportunitiesService, OpportunityFilters } from './emerging-opportunities.service';
import { AnalyticsService } from './analytics.service';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';
import { ConfidenceLevel } from '../common/enums/confidence-level.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly opportunitiesService: EmergingOpportunitiesService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('dashboard/emerging-opportunities')
  async getEmergingOpportunities(
    @Query('stages') stagesParam?: string,
    @Query('minScore', new DefaultValuePipe(0), ParseIntPipe) minScore = 0,
    @Query('confidenceLevel') confidenceLevel?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    const stages = stagesParam
      ? (stagesParam.split(',').filter((s) => Object.values(LifecycleStage).includes(s as LifecycleStage)) as LifecycleStage[])
      : undefined;

    const filters: OpportunityFilters = {
      stages,
      minScore,
      limit: Math.min(limit, 50),
      confidenceLevel: confidenceLevel as ConfidenceLevel | undefined,
    };

    return this.opportunitiesService.getEmergingOpportunities(filters);
  }

  @Get('analytics/stage-distribution')
  async getStageDistribution() {
    return this.analyticsService.getStageDistribution();
  }

  @Get('analytics/rapid-transitions')
  async getRapidTransitions(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days = 7,
  ) {
    return this.analyticsService.getRapidTransitions(days);
  }
}
