import { Module } from '@nestjs/common';
import { UniversityAdminController } from './university-admin.controller';
import { UniversityAdminService } from './university-admin.service';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer'; // Import diskStorage from multer
import { MongooseModule } from '@nestjs/mongoose';
import { University, UniversitySchema } from 'src/schema/university.schema';
import { Subscription, SubscriptionSchema } from 'src/schema/university-subscription.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StudentModule } from '../student/student.module';

@Module({
  imports:[ 
    StudentModule,
    MongooseModule.forFeature([
      { name: University.name, schema: UniversitySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: 'Enrollment', schema: EnrollmentSchema },
    ]),
    MulterModule.register({
    storage: diskStorage({
      destination: './upload', // Directory where the files will be saved
      filename: (req, file, callback) => {
        const ext = path.extname(file.originalname); // Get the file extension
        const filename = `${Date.now()}${ext}`; // Generate a unique filename with the extension
        callback(null, filename); // Store the file with the generated name
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // Optional: Limit file size to 10MB
    fileFilter: (req, file, callback) => {
      callback(null, true);
    },
  }),],
  controllers: [UniversityAdminController],
  providers: [UniversityAdminService],
  exports:[UniversityAdminService]
})
export class UniversityAdminModule {}
