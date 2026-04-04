import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage } from 'src/schema/landing-page.schema';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(LandingPage.name) private landingPageModel: Model<LandingPage>,
  ) {}

  async getLandingPage() {
    let page = await this.landingPageModel.findOne({ slug: 'landing-page' });
    if (!page) {
      // Create default if not exists
      page = await this.landingPageModel.create({ slug: 'landing-page' });
    }
    return page;
  }

  async updateLandingPage(data: any) {
    const page = await this.landingPageModel.findOneAndUpdate(
      { slug: 'landing-page' },
      { $set: data },
      { new: true, upsert: true },
    );
    return page;
  }
}
