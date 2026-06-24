import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { AccelerationMetrics } from '../acceleration/entities/acceleration-metrics.entity';
import { StageTransitionEvent } from './entities/stage-transition-event.entity';
import { StageClassifier } from './stage-classifier';
import { LifecycleService } from './lifecycle.service';
import { StageTransitionService } from './stage-transition.service';

@Module({
  imports: [TypeOrmModule.forFeature([Keyword, AccelerationMetrics, StageTransitionEvent])],
  providers: [StageClassifier, LifecycleService, StageTransitionService],
  exports: [StageClassifier, LifecycleService, StageTransitionService],
})
export class LifecycleModule {}
