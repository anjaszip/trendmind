import {
  Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request,
  HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KeywordsService } from './keywords.service';
import { AddKeywordDto } from './dto/add-keyword.dto';
import { KeywordResponseDto } from './dto/keyword-response.dto';
import { KeywordDetailResponseDto } from './dto/keyword-detail-response.dto';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { StageTransitionEvent } from '../lifecycle/entities/stage-transition-event.entity';

interface AuthenticatedRequest {
  user: { userId: string };
}

@Controller('keywords')
@UseGuards(JwtAuthGuard)
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post()
  async addKeyword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddKeywordDto,
  ): Promise<KeywordResponseDto> {
    const keyword = await this.keywordsService.addKeyword(req.user.userId, dto.term);
    return KeywordResponseDto.from(keyword);
  }

  @Get()
  async listKeywords(
    @Request() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<{ data: KeywordResponseDto[]; total: number; page: number; limit: number }> {
    return this.keywordsService.listKeywords(req.user.userId, page, limit);
  }

  @Get(':id')
  async getKeyword(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<KeywordDetailResponseDto> {
    return this.keywordsService.getKeywordDetail(req.user.userId, id);
  }

  @Get(':id/acceleration-history')
  async getAccelerationHistory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<AccelerationMetrics[]> {
    return this.keywordsService.getAccelerationHistory(req.user.userId, id, days);
  }

  @Get(':id/stage-transitions')
  async getStageTransitions(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<StageTransitionEvent[]> {
    return this.keywordsService.getStageTransitions(req.user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeKeyword(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.keywordsService.removeKeyword(req.user.userId, id);
  }
}
