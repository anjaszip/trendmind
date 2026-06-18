import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { setupTimescaleHypertable } from './timescale/hypertable.config';

@Injectable()
export class TimescaleSetupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TimescaleSetupService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await setupTimescaleHypertable(this.dataSource);
      this.logger.log('TimescaleDB hypertable configured');
    } catch (err) {
      this.logger.warn(`TimescaleDB setup skipped (extension may not be installed): ${err}`);
    }
  }
}
