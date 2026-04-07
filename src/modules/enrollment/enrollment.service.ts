import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/student.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Subscription } from 'src/schema/university-subscription.schema';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
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
        // Log all subscriptions for this universityId just to see what exists
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
        userId: user._id,
        courseId,
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
    const existing = await this.enrollmentModel.findOne({ userId, courseId });
    if (existing) return existing;
    return this.enrollmentModel.create({ userId, courseId, isUniversityStudent: false });
  }

  async getEnrolledCourses(userId: string) {
    const enrollments = await this.enrollmentModel
      .find({ userId })
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
        };
      });

    return { courses };
  }
}
