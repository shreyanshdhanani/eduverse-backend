import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UniversitySubscriptionController } from './university-subscription.controller';
import { UniversitySubscriptionService } from './university-subscription.service';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from 'src/schema/subscription-plan.schema';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schema/university-subscription.schema';
import { University, UniversitySchema } from 'src/schema/university.schema';
import { User, UserSchema } from 'src/schema/student.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: University.name, schema: UniversitySchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [UniversitySubscriptionController],
  providers: [UniversitySubscriptionService],
  exports: [UniversitySubscriptionService],
})
export class UniversitySubscriptionModule {}
