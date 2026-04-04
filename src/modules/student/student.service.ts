import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentRegistrationDto } from './student.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schema/student.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getAll() {
    return this.userModel.find().select('-password -refreshToken');
  }

  async createStudent(newStudent: any) {
    return this.userModel.create(newStudent);
  }

  async registration(studentRegistrationDto: StudentRegistrationDto) {
    const existingUser = await this.userModel.findOne({ email: studentRegistrationDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already in use. Please use a different email.');
    }
    const user = await this.userModel.create(studentRegistrationDto);
    if (user._id) {
      return { message: '🎉 Registration successful! You can now log in.' };
    }
    throw new BadRequestException('Failed to create user. Please try again.');
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password -refreshToken');
  }

  async countStudent() {
    return this.userModel.countDocuments();
  }

  async getStudentByUniversity(university: any) {
    return this.userModel.find({ universityId: university._id });
  }

  // NOTE: forgotPassword and resetPassword are now handled by AuthService
  // These methods on StudentService are kept for backwards compat only

  async resetPasswordById(userId: string, newPassword: string) {
    // FIXED: manually hash before saving so pre-save hook works correctly too
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { password: hashed },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found.');
    return { message: 'Password has been successfully reset.' };
  }
}
