import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// supertest v7 ships as ESM; .default is the callable function
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request: import('supertest').SuperTestStatic = require('supertest').default;
import { AppModule } from '../../src/app.module';

/**
 * E2E: complete user flow
 * register → login → view dashboard → add keyword → view keyword detail
 *
 * Requires a running PostgreSQL + Redis (set TEST_DB_* / TEST_REDIS_* env vars
 * or start the stack with docker compose before running).
 */
describe('Complete user flow (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let keywordId: string;

  const testUser = {
    email: `e2e-flow-${Date.now()}@test.com`,
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register — creates a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  it('POST /auth/login — authenticates existing user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  it('GET /dashboard/emerging-opportunities — returns opportunities list', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /keywords — adds a keyword and returns it', async () => {
    const res = await request(app.getHttpServer())
      .post('/keywords')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ term: 'smart home speaker' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.term).toBe('smart home speaker');
    keywordId = res.body.id;
  });

  it('GET /keywords — lists user keywords including the new one', async () => {
    const res = await request(app.getHttpServer())
      .get('/keywords')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((k: { id: string }) => k.id === keywordId)).toBe(true);
  });

  it('GET /keywords/:id — returns keyword detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/keywords/${keywordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', keywordId);
    expect(res.body).toHaveProperty('lifecycleStage');
    expect(res.body).toHaveProperty('stageTransitions');
  });

  it('GET /keywords/:id — returns 404 for unknown keyword', async () => {
    await request(app.getHttpServer())
      .get('/keywords/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('DELETE /keywords/:id — removes the keyword', async () => {
    await request(app.getHttpServer())
      .delete(`/keywords/${keywordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('GET /keywords/:id — returns 404 after deletion', async () => {
    await request(app.getHttpServer())
      .get(`/keywords/${keywordId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('GET /dashboard/emerging-opportunities — requires auth (401 without token)', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/emerging-opportunities')
      .expect(401);
  });
});
