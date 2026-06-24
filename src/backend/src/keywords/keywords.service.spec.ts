import { KeywordsService } from './keywords.service';

describe('KeywordsService – normalization & validation', () => {
  let service: KeywordsService;

  beforeEach(() => {
    // Instantiate directly – no DB needed for pure logic tests
    service = new KeywordsService(null as never, null as never);
  });

  describe('normalizeKeyword', () => {
    it('lowercases the term', () => {
      expect(service.normalizeKeyword('Wireless EARBUDS')).toBe('wireless earbuds');
    });

    it('trims leading and trailing whitespace', () => {
      expect(service.normalizeKeyword('  standing desk  ')).toBe('standing desk');
    });

    it('removes punctuation except hyphens', () => {
      expect(service.normalizeKeyword('air-purifier!')).toBe('air-purifier');
    });

    it('collapses multiple spaces into one', () => {
      expect(service.normalizeKeyword('yoga   mat')).toBe('yoga mat');
    });

    it('strips HTML tags (XSS sanitization)', () => {
      expect(service.normalizeKeyword('<script>alert(1)</script>')).not.toContain('<');
    });

    it('handles empty string', () => {
      expect(service.normalizeKeyword('')).toBe('');
    });
  });

  describe('validateKeyword', () => {
    it('accepts valid keywords', () => {
      expect(() => service.validateKeyword('wireless earbuds')).not.toThrow();
    });

    it('rejects empty string', () => {
      expect(() => service.validateKeyword('')).toThrow();
    });

    it('rejects keyword exceeding 100 characters', () => {
      expect(() => service.validateKeyword('a'.repeat(101))).toThrow();
    });

    it('rejects keyword with only whitespace', () => {
      expect(() => service.validateKeyword('   ')).toThrow();
    });

    it('rejects SQL injection patterns', () => {
      expect(() => service.validateKeyword("'; DROP TABLE keywords; --")).toThrow();
    });

    it('rejects script tags (XSS)', () => {
      expect(() => service.validateKeyword('<script>alert(1)</script>')).toThrow();
    });

    it('accepts keywords with hyphens and numbers', () => {
      expect(() => service.validateKeyword('led-strip-lights 2024')).not.toThrow();
    });
  });
});
