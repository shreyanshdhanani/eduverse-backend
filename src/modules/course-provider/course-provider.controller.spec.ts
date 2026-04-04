import { Test, TestingModule } from '@nestjs/testing';
import { CourseProviderController } from './course-provider.controller';

describe('CourseProviderController', () => {
  let controller: CourseProviderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseProviderController],
    }).compile();

    controller = module.get<CourseProviderController>(CourseProviderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
