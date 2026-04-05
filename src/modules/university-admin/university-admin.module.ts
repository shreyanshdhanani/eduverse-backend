import { Module } from '@nestjs/common';
import { UniversityAdminController } from './university-admin.controller';
import { UniversityAdminService } from './university-admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { University, UniversitySchema } from 'src/schema/university.schema';
import { Subscription, SubscriptionSchema } from 'src/schema/university-subscription.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StudentModule } from '../student/student.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports:[ 
    StudentModule,
    MongooseModule.forFeature([
      { name: University.name, schema: UniversitySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: 'Enrollment', schema: EnrollmentSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UniversityAdminController],
  providers: [UniversityAdminService, CloudinaryService],
  exports: [UniversityAdminService],
})
export class UniversityAdminModule {}
