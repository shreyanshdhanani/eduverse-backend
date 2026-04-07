import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Section } from 'src/schema/section.schema';
import { Course } from 'src/schema/course.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('courses')
export class CoursesController {

  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}


  @Get('get-all-courses')
  async getAllCourses() {
    return this.coursesService.getAllCourses();
  }

  @Get(':id')
  async getCourseDetails(@Param('id') id: string) {
    return this.coursesService.getCourseDetails(id);
  }

  // Endpoint to add a section to a course
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.SUPER_ADMIN)
  @Post(':courseId/sections')
  async addSection(
    @Param('courseId') courseId: string,
    @Body() section,
  ): Promise<Course> {
    return this.coursesService.addSection(courseId, section);
  }

  // Endpoint to update a section in a course
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.SUPER_ADMIN)
  @Put(':courseId/sections/:sectionId')
  async updateSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() sectionData,
  ) {
    return this.coursesService.updateSection(courseId, sectionId, sectionData);
  }

  // Endpoint to delete a section from a course
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.SUPER_ADMIN)
  @Delete(':courseId/sections/:sectionId')
  async deleteSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.coursesService.deleteSection(courseId, sectionId);
  }

  // Upload section video to Cloudinary
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.SUPER_ADMIN)
  @Post(':courseId/sections/:sectionId/videos')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
    }),
  )
  async addVideoToSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @UploadedFile() video: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(
      video.buffer,
      'lms/courses/videos',
      'video',
    );
    return this.coursesService.addVideo(courseId, sectionId, result.secure_url);
  }

}
