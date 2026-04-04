import { Test, TestingModule } from '@nestjs/testing';
import { UniversityAdminService } from './university-admin.service';

describe('UniversityAdminService', () => {
  let service: UniversityAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UniversityAdminService],
    }).compile();

    service = module.get<UniversityAdminService>(UniversityAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
