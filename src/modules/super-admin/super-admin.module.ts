import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { StudentModule } from '../student/student.module';
import { CourseProviderModule } from '../course-provider/course-provider.module';
import { UniversityAdminModule } from '../university-admin/university-admin.module';
import { CategoryModule } from '../category/category.module';
import { SubCategoryModule } from '../sub-category/sub-category.module';
import { TopicModule } from '../topic/topic.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/student.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    StudentModule,
    CourseProviderModule,
    UniversityAdminModule,
    CategoryModule,
    SubCategoryModule,
    TopicModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
