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
    it('returns list of KeywordResponseDtos', async () => {
      service.listKeywords.mockResolvedValue([makeKeyword(), makeKeyword({ id: 'kw-2', originalTerm: 'standing desk' })]);

      const result = await controller.listKeywords(mockReq);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(KeywordResponseDto);
      expect(service.listKeywords).toHaveBeenCalledWith('user-1');
    });

    it('returns empty array when user has no keywords', async () => {
      service.listKeywords.mockResolvedValue([]);
      const result = await controller.listKeywords(mockReq);
      expect(result).toEqual([]);
    });
  });

  describe('GET /keywords/:id', () => {
    it('returns a single keyword', async () => {
      service.getKeyword.mockResolvedValue(makeKeyword());
      const result = await controller.getKeyword(mockReq, 'kw-1');
      expect(result.id).toBe('kw-1');
    });

    it('throws NotFoundException for unknown keyword', async () => {
      service.getKeyword.mockRejectedValue(new NotFoundException());
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
