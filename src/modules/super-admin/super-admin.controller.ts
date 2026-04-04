import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CourseProviderService } from '../course-provider/course-provider.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly courseProviderService: CourseProviderService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return this.superAdminService.dashboard();
  }

  @Get('course-list')
  async getCourse() {
    return this.courseProviderService.getAllCourses();
  }

  @Put('status/:id')
  async changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.courseProviderService.changeCourseStatus(id, status);
  }

  @Get('student-details/:userId')
  async getStudentFullDetails(@Param('userId') userId: string) {
    return this.superAdminService.getFullEnrollmentDetailsByUser(userId);
  }

  @Get('orders')
  async getAllOrders() {
    return this.superAdminService.getAllOrders();
  }
}
