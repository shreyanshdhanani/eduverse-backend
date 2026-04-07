import { Injectable, HttpException, HttpStatus, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schema/student.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Subscription } from 'src/schema/university-subscription.schema';
import { CourseCertificate } from 'src/schema/course-certificate.schema';
import { Course } from 'src/schema/course.schema';
import { CourseProvider } from 'src/schema/course-provider.schema';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(CourseCertificate.name) private certificateModel: Model<CourseCertificate>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseProvider.name) private courseProviderModel: Model<CourseProvider>,
  ) {}

  async enrollUserInCourse(userId: string, courseId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (user.universityId) {
      // ─── Check already enrolled ───────────────────────────────────────────
      const existingEnrollment = await this.enrollmentModel.findOne({ userId: user._id, courseId });
      if (existingEnrollment) {
        return { message: 'Already enrolled in this course.', status: 'info' };
      }

      // ─── Validate university subscription ────────────────────────────────
      console.log(`[FORENSIC] [EnrollmentService] Student ${user.name} (${user.email}) universityId: ${user.universityId}`);
      
      const subscription = await this.subscriptionModel.findOne({
        university: user.universityId.toString(),
        isActive: true,
      });

      if (!subscription) {
        console.warn(`[FORENSIC] [EnrollmentService] No active subscription found for universityId: ${user.universityId}`);
        const allSubs = await this.subscriptionModel.find({ university: user.universityId });
        console.log(`[FORENSIC] [EnrollmentService] Records found for this universityId: ${allSubs.length}`);
        
        const globalActiveSubs = await this.subscriptionModel.find({ isActive: true });
        const globalSubUniIds = globalActiveSubs.map(s => s.university?.toString() || 'null').join(', ');
        
        let errorMsg = `Your university does not have an active subscription plan. (Debug: Student Uni ID: ${user.universityId?.toString()} | Active Subs For: ${globalSubUniIds})`;
        
        if(allSubs.length > 0) {
           console.log(`[FORENSIC] [EnrollmentService] Found inactive/stale records:`, allSubs.map(s => ({ id: s._id, active: s.isActive, end: s.endDate })));
           errorMsg += ` - Note: Found ${allSubs.length} matching subs but they are inactive or expired.`;
        }
        throw new ForbiddenException(errorMsg);
      }

      if (subscription.endDate && new Date() > subscription.endDate) {
        throw new ForbiddenException('Your university subscription has expired. Please contact your university admin.');
      }

      // ─── Check seat limit ─────────────────────────────────────────────────
      const totalStudents = await this.userModel.countDocuments({ universityId: user.universityId });
      if (totalStudents > subscription.maxStudents) {
        throw new ForbiddenException('Your university has exceeded its student seat limit.');
      }

      // ─── Check per-student course limit ───────────────────────────────────
      if ((user.freeCoursesUsed || 0) >= subscription.maxCoursesPerStudent) {
        throw new ForbiddenException(
          `You have used all ${subscription.maxCoursesPerStudent} free course slots in your plan.`,
        );
      }

      // ─── Enroll and increment counter ─────────────────────────────────────
      const newEnrollment = new this.enrollmentModel({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(courseId),
        isUniversityStudent: true,
      });
      await newEnrollment.save();

      await this.userModel.findByIdAndUpdate(userId, { $inc: { freeCoursesUsed: 1 } });

      return {
        message: 'Enrolled successfully for free as a university student.',
        status: 'success',
        freeCoursesUsed: (user.freeCoursesUsed || 0) + 1,
        maxCoursesPerStudent: subscription.maxCoursesPerStudent,
      };
    } else {
      return { message: 'You need to purchase this course to enroll.', status: 'purchase_required' };
    }
  }

  async enrollAfterPayment(userId: string, courseId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const courseObjectId = new Types.ObjectId(courseId);

    const existing = await this.enrollmentModel.findOne({
      $or: [
        { userId: userObjectId, courseId: courseObjectId },
        { userId: userId as any, courseId: courseId as any }
      ]
    });
    if (existing) return existing;

    return this.enrollmentModel.create({
      userId: userObjectId,
      courseId: courseObjectId,
      isUniversityStudent: false
    });
  }

  async getEnrolledCourses(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    const enrollments = await this.enrollmentModel
      .find({
        $or: [
          { userId: userObjectId },
          { userId: userId as any }
        ]
      })
      .populate('courseId');

    const courses = enrollments
      .filter((enroll) => enroll.courseId !== null)
      .map((enroll) => {
        const course = enroll.courseId as any;
        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          level: course.level,
          duration: course.duration,
          language: course.language,
          category: course.category,
          subcategory: course.subcategory,
          topic: course.topic,
          courseProvider: course.courseProvider,
          progress: enroll.progress || 0,
          certificateIssued: enroll.certificateIssued || false,
        };
      });

    return { courses };
  }

  // ─── Progress Tracking ───────────────────────────────────────────────────────

  async updateProgress(userId: string, courseId: string, progress: number) {
    const userObjectId = new Types.ObjectId(userId);
    const courseObjectId = new Types.ObjectId(courseId);

    console.log(`[DEBUG] Updating progress: user=${userId}, course=${courseId}, progress=${progress}`);

    // Robust lookup: Check both ObjectId and string versions to handle legacy data
    let enrollment = await this.enrollmentModel.findOne({
      userId: userObjectId,
      courseId: courseObjectId,
    });

    if (!enrollment) {
      // Direct raw query to bypass Mongoose's automatic casting/enforcement
      enrollment = await this.enrollmentModel.findOne({
        $or: [
          { userId: userId as any, courseId: courseId as any },
          { userId: userId as any, courseId: courseObjectId },
          { userId: userObjectId, courseId: courseId as any }
        ]
      });
    }

    if (!enrollment) {
      console.warn(`[DEBUG] Enrollment NOT FOUND for user=${userId}, course=${courseId}`);
      throw new NotFoundException('Enrollment not found.');
    }

    // Only advance progress, never go backward
    const newProgress = Math.max(enrollment.progress || 0, Math.min(100, progress));
    enrollment.progress = newProgress;

    if (newProgress >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
    }

    await enrollment.save();

    return { progress: newProgress, status: enrollment.status };
  }

  // ─── Certificate Issuance ────────────────────────────────────────────────────

  async issueCertificate(userId: string, courseId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const courseObjectId = new Types.ObjectId(courseId);

    // Robust lookup
    let enrollment = await this.enrollmentModel.findOne({
      userId: userObjectId,
      courseId: courseObjectId,
    });

    if (!enrollment) {
      enrollment = await this.enrollmentModel.findOne({
        $or: [
          { userId: userId as any, courseId: courseId as any },
          { userId: userId as any, courseId: courseObjectId },
          { userId: userObjectId, courseId: courseId as any }
        ]
      });
    }

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }

    // Check if already issued
    if (enrollment.certificateIssued) {
      const existing = await this.certificateModel.findOne({
        studentId: userObjectId,
        courseId: courseObjectId,
      }).populate('courseId courseProviderId studentId');
      return existing;
    }

    // Fetch course and student details
    const course = await this.courseModel.findById(courseId).populate('courseProvider');
    if (!course) throw new NotFoundException('Course not found.');

    const student = await this.userModel.findById(userId);
    if (!student) throw new NotFoundException('Student not found.');

    const provider = course.courseProvider as any;

    // Create certificate
    const certificate = await this.certificateModel.create({
      enrollmentId: enrollment._id,
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(userId),
      courseProviderId: provider._id || provider,
      universityId: student.universityId || null,
      courseTitle: course.title,
      studentName: student.name,
      providerName: provider.name || 'Course Provider',
      issuedAt: new Date(),
    });

    // Mark enrollment as certificate issued
    await this.enrollmentModel.findByIdAndUpdate(enrollment._id, {
      certificateIssued: true,
      status: 'completed',
      progress: 100,
    });

    return certificate;
  }

  async getCertificate(userId: string, courseId: string) {
    const certificate = await this.certificateModel.findOne({
      studentId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
    });

    return certificate;
  }

  // ─── Global: All certificates for a student ──────────────────────────────────

  async getStudentCertificates(userId: string) {
    return this.certificateModel
      .find({ studentId: new Types.ObjectId(userId) })
      .sort({ issuedAt: -1 });
  }
}
