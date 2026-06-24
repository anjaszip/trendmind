import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { KeywordResponseDto } from './dto/keyword-response.dto';
import { Keyword } from './entities/keyword.entity';
import { LifecycleStage } from '../common/enums/lifecycle-stage.enum';

function makeKeyword(overrides: Partial<Keyword> = {}): Keyword {
  const kw = new Keyword();
  kw.id = 'kw-1';
  kw.userId = 'user-1';
  kw.originalTerm = 'wireless earbuds';
  kw.normalizedForm = 'wireless earbuds';
  kw.currentLifecycleStage = LifecycleStage.SEED;
  kw.monitoringStatus = 'active';
  kw.isSeedKeyword = false;
  kw.createdAt = new Date();
  kw.updatedAt = new Date();
  kw.stageEnteredAt = new Date();
  return Object.assign(kw, overrides);
}

const mockReq = { user: { userId: 'user-1' } };

describe('KeywordsController', () => {
  let controller: KeywordsController;
  let service: jest.Mocked<KeywordsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeywordsController],
      providers: [
        {
          provide: KeywordsService,
          useValue: {
            addKeyword: jest.fn(),
            listKeywords: jest.fn(),
            getKeyword: jest.fn(),
            getKeywordDetail: jest.fn(),
            getAccelerationHistory: jest.fn(),
            getStageTransitions: jest.fn(),
            removeKeyword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<KeywordsController>(KeywordsController);
    service = module.get(KeywordsService);
  });

  describe('POST /keywords', () => {
    it('returns a KeywordResponseDto on success', async () => {
      const kw = makeKeyword();
      service.addKeyword.mockResolvedValue(kw);

      const result = await controller.addKeyword(mockReq, { term: 'wireless earbuds' });

      expect(result).toBeInstanceOf(KeywordResponseDto);
      expect(result.term).toBe('wireless earbuds');
      expect(service.addKeyword).toHaveBeenCalledWith('user-1', 'wireless earbuds');
    });

    it('propagates ConflictException for duplicate keywords', async () => {
      service.addKeyword.mockRejectedValue(new ConflictException('Already monitoring'));
      await expect(controller.addKeyword(mockReq, { term: 'wireless earbuds' })).rejects.toThrow(ConflictException);
    });

    it('propagates BadRequestException for invalid keywords', async () => {
      service.addKeyword.mockRejectedValue(new BadRequestException('Invalid'));
      await expect(controller.addKeyword(mockReq, { term: '<script>' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /keywords', () => {
    it('returns paginated list of KeywordResponseDtos', async () => {
      const kws = [makeKeyword(), makeKeyword({ id: 'kw-2', originalTerm: 'standing desk' })];
      service.listKeywords.mockResolvedValue({ data: kws.map(KeywordResponseDto.from), total: 2, page: 1, limit: 20 });

      const result = await controller.listKeywords(mockReq, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).toBeInstanceOf(KeywordResponseDto);
      expect(service.listKeywords).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('returns empty data when user has no keywords', async () => {
      service.listKeywords.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      const result = await controller.listKeywords(mockReq, 1, 20);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('GET /keywords/:id', () => {
    it('returns keyword detail', async () => {
      service.getKeywordDetail.mockResolvedValue({ id: 'kw-1', term: 'wireless earbuds' } as any);
      const result = await controller.getKeyword(mockReq, 'kw-1');
      expect(result.id).toBe('kw-1');
      expect(service.getKeywordDetail).toHaveBeenCalledWith('user-1', 'kw-1');
    });

    it('throws NotFoundException for unknown keyword', async () => {
      service.getKeywordDetail.mockRejectedValue(new NotFoundException());
      await expect(controller.getKeyword(mockReq, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /keywords/:id', () => {
    it('calls removeKeyword with correct args', async () => {
      service.removeKeyword.mockResolvedValue(undefined);
      await controller.removeKeyword(mockReq, 'kw-1');
      expect(service.removeKeyword).toHaveBeenCalledWith('user-1', 'kw-1');
    });

    it('propagates NotFoundException for unknown keyword', async () => {
      service.removeKeyword.mockRejectedValue(new NotFoundException());
      await expect(controller.removeKeyword(mockReq, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('prevents removal of seed keywords', async () => {
      service.removeKeyword.mockRejectedValue(new BadRequestException('Seed keywords cannot be removed'));
      await expect(controller.removeKeyword(mockReq, 'seed-kw')).rejects.toThrow(BadRequestException);
    });
  });
});
