import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { MulterModule } from '@nestjs/platform-express';

// Feature modules
import { CategoryModule } from './modules/category/category.module';
import { SubCategoryModule } from './modules/sub-category/sub-category.module';
import { TopicModule } from './modules/topic/topic.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './modules/student/student.module';
import { CourseProviderModule } from './modules/course-provider/course-provider.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { UniversityAdminModule } from './modules/university-admin/university-admin.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CartModule } from './modules/cart/cart.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { CmsModule } from './modules/cms/cms.module';

@Module({
  imports: [
    // 1. Config
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      isGlobal: true,
    }),

    // 2. Throttler
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    // 3. Multer
    MulterModule.register({ 
        dest: './upload' 
    }),

    // 4. Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: false, // Port 587 requires STARTTLS, so secure must be false
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: false, // Critical for many dev environments
          },
        },
        defaults: { from: configService.get<string>('MAIL_FROM') || 'Eduverse <noreply@eduverse.com>' },
        template: {
          dir: join(__dirname, 'public', 'templates'),
          adapter: new EjsAdapter(),
          options: { strict: false },
        },
      }),
      inject: [ConfigService],
    }),

    // 5. MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL'),
      }),
      inject: [ConfigService],
    }),

    // 6. Feature modules
    CategoryModule,
    SubCategoryModule,
    TopicModule,
    AuthModule,
    StudentModule,
    CourseProviderModule,
    SuperAdminModule,
    UniversityAdminModule,
    QuizModule,
    CoursesModule,
    CartModule,
    EnrollmentModule,
    StripeModule,
    CmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
