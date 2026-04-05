import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { Section, SectionSchema } from 'src/schema/section.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports:[
    MongooseModule.forFeature([
          {name: Course.name, schema: CourseSchema},
          {name: Section.name, schema: SectionSchema},
        ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, CloudinaryService]
})
export class CoursesModule {}
