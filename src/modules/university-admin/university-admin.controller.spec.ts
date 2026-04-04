import { Test, TestingModule } from '@nestjs/testing';
import { UniversityAdminController } from './university-admin.controller';

describe('UniversityAdminController', () => {
  let controller: UniversityAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniversityAdminController],
    }).compile();

    controller = module.get<UniversityAdminController>(UniversityAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
