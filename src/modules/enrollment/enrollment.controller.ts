import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('enroll')
  async enrollment(@Body('courseId') courseId: string, @CurrentUser() user: any) {
    return this.enrollmentService.enrollUserInCourse(user._id, courseId);
  }

  @Get('enrolled-courses')
  async getEnrolledCourses(@CurrentUser() user: any) {
    return this.enrollmentService.getEnrolledCourses(user._id);
  }

  // ─── Progress Tracking ─────────────────────────────────────────────────────

  @Patch('progress')
  async updateProgress(
    @Body('courseId') courseId: string,
    @Body('progress') progress: number,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentService.updateProgress(user._id, courseId, progress);
  }

  // ─── Certificate ────────────────────────────────────────────────────────────

  @Post('certificate/issue')
  async issueCertificate(@Body('courseId') courseId: string, @CurrentUser() user: any) {
    return this.enrollmentService.issueCertificate(user._id, courseId);
  }

  @Get('certificate/:courseId')
  async getCertificate(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.enrollmentService.getCertificate(user._id, courseId);
  }

  @Get('my-certificates')
  async getMyCertificates(@CurrentUser() user: any) {
    return this.enrollmentService.getStudentCertificates(user._id);
  }
}
