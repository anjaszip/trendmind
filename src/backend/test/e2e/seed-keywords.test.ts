import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// supertest v7 ships as ESM; .default is the callable function
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request: import('supertest').SuperTestStatic = require('supertest').default;
import { AppModule } from '../../src/app.module';

/**
 * E2E: seed keywords
 * Verifies 20 seed keywords are present in the database and appear in the
 * dashboard for a new user (since seed keywords are global, not user-owned).
 */
describe('Seed keywords (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const EXPECTED_SEED_COUNT = 20;
  const KNOWN_SEEDS = [
    'wireless earbuds',
    'standing desk',
    'air purifier',
    'resistance bands',
    'portable blender',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Register a fresh user
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `e2e-seed-${Date.now()}@test.com`, password: 'TestPassword123!' });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /dashboard/emerging-opportunities — returns at least ${EXPECTED_SEED_COUNT} seed opportunities for new user`, async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(EXPECTED_SEED_COUNT);
  });

  it('seed keywords include known terms in opportunities', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const terms: string[] = res.body.map((o: { keyword: string }) => o.keyword.toLowerCase());
    for (const seed of KNOWN_SEEDS) {
      expect(terms.some((t) => t.includes(seed))).toBe(true);
    }
  });

  it('each opportunity has required fields: keyword, lifecycleStage, predictionScore', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    for (const opp of res.body) {
      expect(opp).toHaveProperty('keyword');
      expect(opp).toHaveProperty('lifecycleStage');
      expect(opp).toHaveProperty('predictionScore');
      expect(typeof opp.predictionScore).toBe('number');
    }
  });

  it('prediction scores are between 0 and 100', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    for (const opp of res.body) {
      expect(opp.predictionScore).toBeGreaterThanOrEqual(0);
      expect(opp.predictionScore).toBeLessThanOrEqual(100);
    }
  });
});
