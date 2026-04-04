import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/student.schema';
import { Enrollment } from 'src/schema/enrollment.schema';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
  ) {}

  async enrollUserInCourse(userId: string, courseId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (user.universityId) {
      const existingEnrollment = await this.enrollmentModel.findOne({ userId: user._id, courseId });
      if (existingEnrollment) {
        return { message: 'Already enrolled in this course.', status: 'info' };
      }
      const newEnrollment = new this.enrollmentModel({ userId: user._id, courseId, isUniversityStudent: true });
      await newEnrollment.save();
      return { message: 'Enrolled successfully for free as a university student.', status: 'success' };
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
