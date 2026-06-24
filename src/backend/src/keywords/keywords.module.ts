import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Keyword } from './entities/keyword.entity';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';
import { TrendCollectionQueue } from '../jobs/queues/trend-collection.queue';
import { QUEUE_NAMES } from '../common/config/bullmq.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Keyword]),
    BullModule.registerQueue({ name: QUEUE_NAMES.TREND_COLLECTION }),
  ],
  providers: [KeywordsService, TrendCollectionQueue],
  controllers: [KeywordsController],
  exports: [KeywordsService],
})
export class KeywordsModule {}
