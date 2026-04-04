import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StudentRegistrationDto } from './student.dto';
import { StudentService } from './student.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly authService: AuthService,
  ) {}

  // Admin: get all students
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get()
  async getAll() {
    return this.studentService.getAll();
  }

  // Public registration (legacy — auth/register/user is preferred)
  @Post('registration')
  async studentRegistration(@Body() studentRegistrationDto: StudentRegistrationDto) {
    return this.studentService.registration(studentRegistrationDto);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password, Role.USER);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body.email, Role.USER);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.token, body.password);
  }

  // Authenticated user: get own profile
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.studentService.findById(user._id);
  }
}
