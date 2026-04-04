import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { User } from 'src/schema/student.schema';
import { CourseProvider } from 'src/schema/course-provider.schema';
import { SuperAdmin } from 'src/schema/super-admin.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(CourseProvider.name) private providerModel: Model<CourseProvider>,
    @InjectModel(SuperAdmin.name) private adminModel: Model<SuperAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const { sub, email, role } = payload;
    let user: any = null;

    if (role === 'super_admin') {
      user = await this.adminModel.findById(sub).lean();
    } else if (role === 'provider') {
      user = await this.providerModel.findById(sub).lean();
    } else {
      user = await this.userModel.findById(sub).lean();
    }

    if (!user) return null;

    return { _id: sub, email, role };
  }
}
