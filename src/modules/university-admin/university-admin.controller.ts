import { Body, Controller, Get, Param, Patch, Post, Res, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UniversityAdminService } from './university-admin.service';
import { UniversityRegistrationDto } from './university.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'
import * as csvParser from 'csv-parser'; 
import { Readable } from 'stream';
import { Role } from 'src/common/enums/role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('university-admin')
export class UniversityAdminController {
  constructor(
    private readonly universityAdminService: UniversityAdminService,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── University Registration (with logo upload) ───────────────────────────────

  @Post('university-registration')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async universityRegistration(
    @Body() universityRegistrationDto: UniversityRegistrationDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadFile(
        logo.buffer,
        'lms/universities/logos',
        'image',
      );
      universityRegistrationDto.logo = result.secure_url;
    }
    return this.universityAdminService.universityRegistration(universityRegistrationDto);
  }

  @Post('university-login')
  async studentLogin(@Body() body: { email: string, password: string }) {
    const { email, password } = body;
    const admin = await this.universityAdminService.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('invalid credential');
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('invalid credential');
    }
    const payload = { sub: (admin as any)._id.toString(), email: admin.email, role: Role.UNIVERSITY };
    const token = this.jwtService.sign(payload);
    return { message: 'Login successful', token };
  }

  @Get()
  async getAll() {
    return await this.universityAdminService.getAll();
  }

  @Get('university-student/:token')
  async getAllStudentsByUniversity(@Param('token') token: string) {
    return await this.universityAdminService.getAllStudentsByUniversity(token);
  }

  @Post('status/:id')
  async changeStatus(@Param('id') id: string, @Body('status') status: string) {
    console.log('status', status);
    console.log('id', id);
    return this.universityAdminService.changeStatus(id, status);
  }

  // ─── PDF Download (generates locally then streams, not Cloudinary) ────────────

  @Get('generate-pdf')
  async generatePDF(@Res() res: Response) {
    const pdfPath = await this.universityAdminService.generateUniversityPDF();
    const stream = createReadStream(pdfPath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=universities.pdf',
    });
    stream.pipe(res);
  }

  @Post('get-subscription')
  async getSubscription(@Body('id') id: string, @Body('type') plan: string) {
    return this.universityAdminService.getSubscription(id, plan);
  }

  // ─── CSV Student Bulk Upload (parsed in-memory, NOT stored on Cloudinary) ─────

  @Post('upload-student')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadStudent(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const { universityId } = body;
    const students = await this.parseCSV(file);
    await this.universityAdminService.uploadStudents(students, universityId);
  }

  // Helper: parse CSV from in-memory buffer (no disk access needed)
  private parseCSV(file: Express.Multer.File): Promise<any[]> {
    const students: any[] = [];
    return new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csvParser())
        .on('data', (row) => students.push(row))
        .on('end', () => resolve(students))
        .on('error', (err) => reject(err));
    });
  }

  @Get('dashboard-stats/:token')
  async getDashboardStats(@Param('token') token: string) {
    return this.universityAdminService.getDashboardStats(token);
  }

  @Get('profile/:token')
  async getProfile(@Param('token') token: string) {
    return this.universityAdminService.getProfile(token);
  }

  // ─── Update Profile (with optional logo upload) ───────────────────────────────

  @Patch('profile/:token')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  async updateProfile(
    @Param('token') token: string,
    @Body() updateData: any,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    if (logo) {
      const result = await this.cloudinaryService.uploadFile(
        logo.buffer,
        'lms/universities/logos',
        'image',
      );
      updateData.logo = result.secure_url;
    }
    return this.universityAdminService.updateProfile(token, updateData);
  }

  @Get('get-enrolled-students/:token')
  async getEnrolledStudents(@Param('token') token: string) {
    return this.universityAdminService.getEnrolledStudents(token);
  }
}
