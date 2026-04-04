import { Test, TestingModule } from '@nestjs/testing';
import { CourseProviderService } from './course-provider.service';

describe('CourseProviderService', () => {
  let service: CourseProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseProviderService],
    }).compile();

    service = module.get<CourseProviderService>(CourseProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
