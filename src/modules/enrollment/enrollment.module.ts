import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/student.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { Subscription, SubscriptionSchema } from 'src/schema/university-subscription.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
