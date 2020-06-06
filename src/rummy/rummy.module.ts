import { Module } from '@nestjs/common';
import { RummyService } from './rummy.service';
import { RummyController } from './rummy.controller';

@Module({
  providers: [RummyService],
  controllers: [RummyController]
})
export class RummyModule {}