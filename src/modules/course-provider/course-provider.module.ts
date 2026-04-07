import { Module } from '@nestjs/common';
import { CourseProviderController } from './course-provider.controller';
import { CourseProviderService } from './course-provider.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseProvider, CourseProviderSchema } from 'src/schema/course-provider.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { CategoryModule } from '../category/category.module';
import { SubCategoryModule } from '../sub-category/sub-category.module';
import { TopicModule } from '../topic/topic.module';
import { CourseProviderProfile, CourseProviderProfileSchema } from 'src/schema/course-provider-profile.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { AuthModule } from 'src/auth/auth.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CourseCertificate, CourseCertificateSchema } from 'src/schema/course-certificate.schema';

@Module({
  imports: [
    AuthModule,
    CategoryModule,
    SubCategoryModule,
    TopicModule,
    MongooseModule.forFeature([
      { name: CourseProvider.name, schema: CourseProviderSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CourseProviderProfile.name, schema: CourseProviderProfileSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Order.name, schema: OrderSchema },
      { name: CourseCertificate.name, schema: CourseCertificateSchema },
    ]),
  ],
  controllers: [CourseProviderController],
  providers: [CourseProviderService, CloudinaryService],
  exports: [CourseProviderService],
})
export class CourseProviderModule {}
