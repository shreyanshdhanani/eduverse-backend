import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/schema/student.schema';
import { CourseProvider } from 'src/schema/course-provider.schema';
import { SuperAdmin } from 'src/schema/super-admin.schema';
import { Role } from 'src/common/enums/role.enum';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailerService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(CourseProvider.name) private providerModel: Model<CourseProvider>,
    @InjectModel(SuperAdmin.name) private adminModel: Model<SuperAdmin>,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private generateAccessToken(payload: { sub: string; email: string; role: string }) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });
  }

  private generateRefreshToken(payload: { sub: string; email: string; role: string }) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private getModelByRole(role: Role) {
    if (role === Role.SUPER_ADMIN) return this.adminModel;
    if (role === Role.PROVIDER) return this.providerModel;
    return this.userModel;
  }

  // ─── Register ──────────────────────────────────────────────────────────────

  async registerUser(data: { name: string; email: string; password: string }) {
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) throw new BadRequestException('Email already in use.');
    await this.userModel.create({ ...data, role: Role.USER });
    return { message: '🎉 Registration successful! You can now log in.' };
  }

  async registerProvider(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) {
    const existing = await this.providerModel.findOne({ email: data.email });
    if (existing) throw new BadRequestException('Email already in use.');
    const provider = await this.providerModel.create({ ...data, role: Role.PROVIDER });
    try {
      await this.mailService.sendMail({
        to: provider.email,
        subject: 'Welcome to Our Platform!',
        template: 'course-provider-welcome',
        context: { name: provider.name },
      });
      console.log(`✅ Provider welcome email sent to: ${provider.email}`);
    } catch (mailError) {
      console.error(`❌ Failed to send provider welcome email to ${provider.email}:`, mailError);
    }
    return { message: 'Registration successful. Await admin approval.' };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(email: string, password: string, role: Role) {
    const model = this.getModelByRole(role);
    const user = await (model as any).findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials.');

    // Check provider approval (case-insensitive)
    if (role === Role.PROVIDER && user.status?.toLowerCase() !== 'approved') {
      throw new ForbiddenException('Your account is pending approval.');
    }

    const payload = { sub: user._id.toString(), email: user.email, role };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store hashed refresh token
    const hashedRefresh = await this.hashToken(refreshToken);
    await (model as any).findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    if (role === Role.SUPER_ADMIN) {
      await this.adminModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.name, role },
    };
  }

  // ─── Refresh ────────────────────────────────────────────────────────────────

  async refreshTokens(userId: string, role: Role, refreshToken: string) {
    const model = this.getModelByRole(role);
    const user = await (model as any).findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied.');

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Refresh token invalid or expired.');

    const payload = { sub: userId, email: user.email, role };
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    const hashedRefresh = await this.hashToken(newRefreshToken);
    await (model as any).findByIdAndUpdate(userId, { refreshToken: hashedRefresh });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string, role: Role) {
    const model = this.getModelByRole(role);
    await (model as any).findByIdAndUpdate(userId, { refreshToken: null });
    return { message: 'Logged out successfully.' };
  }

  // ─── Me ─────────────────────────────────────────────────────────────────────

  async getMe(userId: string, role: Role) {
    const model = this.getModelByRole(role);
    const user = await (model as any)
      .findById(userId)
      .select('-password -refreshToken')
      .lean();
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // ─── Forgot / Reset Password ────────────────────────────────────────────────

  async forgotPassword(email: string, role: Role) {
    const model = this.getModelByRole(role);
    const user = await (model as any).findOne({ email });
    if (!user) throw new NotFoundException('Email not found.');

    const resetPayload = { sub: user._id.toString(), email, role };
    const token = this.jwtService.sign(resetPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h',
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Reset Your Password',
        template: 'forgot-password',
        context: { name: user.name, resetLink },
      });
      console.log(`✅ Forgot password email sent to: ${user.email}`);
    } catch (mailError) {
      console.error(`❌ Failed to send forgot password email to ${user.email}:`, mailError);
    }

    return { message: 'Password reset link sent to your email.' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const model = this.getModelByRole(payload.role);
    const hashed = await bcrypt.hash(newPassword, 10);
    await (model as any).findByIdAndUpdate(payload.sub, { password: hashed });
    return { message: 'Password reset successfully.' };
  }

  // ─── Seed Super Admin ───────────────────────────────────────────────────────

  async seedSuperAdmin() {
    const existing = await this.adminModel.findOne({ role: Role.SUPER_ADMIN });
    if (existing) return { message: 'Super admin already exists.' };

    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL') || 'admin@eduverse.com';
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD') || 'Admin@Secure123';

    await this.adminModel.create({ email, password, role: Role.SUPER_ADMIN });
    return { message: `Super admin created: ${email}` };
  }
}
