import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;
}

class RegisterUserDto {
  @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

class RegisterProviderDto {
  @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsNotEmpty() phone: string;
  @IsNotEmpty() address: string;
}

class ForgotPasswordDto {
  @IsEmail() email: string;
  @IsEnum(Role) role: Role;
}

class ResetPasswordDto {
  @IsNotEmpty() token: string;
  @IsString() @MinLength(6) newPassword: string;
}

class RefreshDto {
  @IsNotEmpty() refreshToken: string;
  @IsEnum(Role) role: Role;
}

class ChangePasswordDto {
  @IsString() @IsNotEmpty() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  @Post('register/user')
  registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('register/provider')
  registerProvider(@Body() dto: RegisterProviderDto) {
    return this.authService.registerProvider(dto);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.role);
  }

  // ─── Seed ──────────────────────────────────────────────────────────────────

  @Post('seed-admin')
  seedAdmin() {
    return this.authService.seedSuperAdmin();
  }

  // ─── Refresh ────────────────────────────────────────────────────────────────

  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: any) {
    // userId comes from a separate short-lived token or client stores it
    const userId = req.headers['x-user-id'];
    return this.authService.refreshTokens(userId, dto.role, dto.refreshToken);
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user._id, user.role);
  }

  // ─── Me ─────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user._id, user.role);
  }

  // ─── Forgot / Reset ─────────────────────────────────────────────────────────

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.role);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ─── Change Password (university students) ──────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.authService.changePassword(user._id, dto.currentPassword, dto.newPassword);
  }
}
