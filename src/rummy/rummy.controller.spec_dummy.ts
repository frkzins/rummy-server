import { Test, TestingModule } from '@nestjs/testing';
import { RummyController } from './rummy.controller';

describe('Rummy Controller', () => {
  let controller: RummyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RummyController],
    }).compile();

    controller = module.get<RummyController>(RummyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});