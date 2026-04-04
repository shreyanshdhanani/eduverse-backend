import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/schema/order.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { User, UserSchema } from 'src/schema/student.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
