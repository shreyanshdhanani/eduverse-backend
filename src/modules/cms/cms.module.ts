import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { LandingPage, LandingPageSchema } from '../../schema/landing-page.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: LandingPage.name, schema: LandingPageSchema }]),
  ],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
