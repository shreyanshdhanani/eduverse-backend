import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CourseProviderService } from './course-provider.service';
import { CreateCourseProviderDto } from './course-provider.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('course-provider')
export class CourseProviderController {
  constructor(private readonly courseProviderService: CourseProviderService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Post('registration')
  async Registration(@Body() createCourseProviderDto: CreateCourseProviderDto) {
    return this.courseProviderService.register(createCourseProviderDto);
  }

  @Get('by-category')
  getCoursesByCategory(
    @Query('categoryId') categoryId: string,
    @Query('subcategoryId') subcategoryId?: string,
  ) {
    return this.courseProviderService.getCoursesByCategory(categoryId, subcategoryId);
  }

  // ─── Admin Only ──────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('all-course-providers')
  async getAllCourseProvider() {
    return this.courseProviderService.getAllCourseProvider();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('status/:id')
  async changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.courseProviderService.changeProviderStatus(id, status);
  }

  // ─── Provider Only ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Post('dashboard')
  async dashboard(@CurrentUser() user: any) {
    return this.courseProviderService.dashboard(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('get-courses')
  async getCourseList(@CurrentUser() user: any) {
    return this.courseProviderService.getCourseList(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('get-enrolled-students')
  async getEnrolledStudents(@CurrentUser() user: any) {
    return this.courseProviderService.getEnrolledStudents(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('get-status')
  async getStatus(@CurrentUser() user: any) {
    return this.courseProviderService.getProviderStatus(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.courseProviderService.getProfile(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profilePicture', maxCount: 1 }], {
      storage: diskStorage({
        destination: './upload/course-providers/profile',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @Patch('profile')
  async updateProfile(
    @UploadedFiles() files: { profilePicture?: Express.Multer.File[] },
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const profileData = { ...body };
    if (files?.profilePicture?.[0]) {
      profileData.profilePicture = files.profilePicture[0].filename;
    }
    return this.courseProviderService.updateProfile(user._id, profileData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnailImage', maxCount: 1 },
        { name: 'previewVideo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './upload/courses',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  @Post('upload-basic-information/:id')
  async uploadBasicInformation(
    @Param('id') id: string,
    @UploadedFiles() files: { thumbnailImage?: Express.Multer.File[]; previewVideo?: Express.Multer.File[] },
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    // Ownership check if editing existing course
    if (id !== 'new-course') {
      await this.courseProviderService.verifyCourseOwnership(id, user._id);
    }
    const courseData = {
      courseId: id,
      title: body.title,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      topic: body.topic,
      level: body.level,
      language: body.language,
      duration: body.duration,
      price: body.price,
      thumbnailImage: files?.thumbnailImage?.[0]?.filename || null,
      previewVideo: files?.previewVideo?.[0]?.filename || null,
    };
    return this.courseProviderService.uploadBasicInformation(courseData, user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('orders')
  async getProviderOrders(@CurrentUser() user: any) {
    return this.courseProviderService.getProviderOrders(user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  @Get('earnings')
  async getProviderEarningsAnalytics(@CurrentUser() user: any) {
    return this.courseProviderService.getProviderEarningsAnalytics(user._id);
  }

  // ─── Shared (Provider + Admin) ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.courseProviderService.getAllCourses();
  }

  @UseGuards(JwtAuthGuard)
  @Post('get-single-course/:id')
  async getCourseDetails(@Param('id') id: string) {
    return this.courseProviderService.getCourseDetails(id);
  }
}