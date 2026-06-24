import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KeywordsService } from './keywords.service';
import { AddKeywordDto } from './dto/add-keyword.dto';
import { KeywordResponseDto } from './dto/keyword-response.dto';

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
  async listKeywords(@Request() req: AuthenticatedRequest): Promise<KeywordResponseDto[]> {
    const keywords = await this.keywordsService.listKeywords(req.user.userId);
    return keywords.map(KeywordResponseDto.from);
  }

  @Get(':id')
  async getKeyword(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<KeywordResponseDto> {
    const keyword = await this.keywordsService.getKeyword(req.user.userId, id);
    return KeywordResponseDto.from(keyword);
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
