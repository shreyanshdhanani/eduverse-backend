import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/student.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { Subscription, SubscriptionSchema } from 'src/schema/university-subscription.schema';
import { CourseCertificate, CourseCertificateSchema } from 'src/schema/course-certificate.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { CourseProvider, CourseProviderSchema } from 'src/schema/course-provider.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: CourseCertificate.name, schema: CourseCertificateSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CourseProvider.name, schema: CourseProviderSchema },
    ]),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
