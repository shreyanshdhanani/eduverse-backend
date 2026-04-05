import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseProviderDto } from './course-provider.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CourseProvider } from 'src/schema/course-provider.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { Course } from 'src/schema/course.schema';
import { CategoryService } from '../category/category.service';
import { SubCategoryService } from '../sub-category/sub-category.service';
import { TopicService } from '../topic/topic.service';
import { Types } from 'mongoose';
import { CourseProviderProfile } from 'src/schema/course-provider-profile.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Order, PaymentStatus } from 'src/schema/order.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CourseProviderService {
  constructor(
    @InjectModel(CourseProvider.name) private courseProviderModel: Model<CourseProvider>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(CourseProviderProfile.name) private courseProviderProfile: Model<CourseProviderProfile>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubCategoryService,
    private readonly topicService: TopicService,
    private readonly mailService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async dashboard(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');

    const totalCourses = await this.courseModel.countDocuments({ courseProvider: courseProvider._id });
    const totalApprovedCourses = await this.courseModel.countDocuments({ courseProvider: courseProvider._id, approvalStatus: 'Approved' });
    const totalPendingCourses = await this.courseModel.countDocuments({ courseProvider: courseProvider._id, approvalStatus: 'Pending' });
    const totalRejectedCourses = await this.courseModel.countDocuments({ courseProvider: courseProvider._id, approvalStatus: 'Rejected' });

    const courses = await this.courseModel.find({ courseProvider: courseProvider._id }).select('_id');
    const courseIds = courses.map((c) => c._id);
    const totalEnrolledStudents = await this.enrollmentModel.countDocuments({ courseId: { $in: courseIds } });

    return { totalCourses, totalApprovedCourses, totalPendingCourses, totalRejectedCourses, totalEnrolledStudents };
  }

  // ─── Register ───────────────────────────────────────────────────────────────

  async register(createCourseProviderDto: CreateCourseProviderDto) {
    const courseProvider = await this.courseProviderModel.create(createCourseProviderDto);
    if (courseProvider._id) {
      try {
        await this.mailService.sendMail({
          to: courseProvider.email,
          subject: 'Welcome to Our Platform!',
          template: 'course-provider-welcome',
          context: { name: courseProvider.name },
        });
        console.log(`✅ Course provider welcome email sent to: ${courseProvider.email}`);
      } catch (mailError) {
        console.error(`❌ Failed to send course provider welcome email to ${courseProvider.email}:`, mailError);
      }
    }
    return { message: 'Registration successful. Await admin approval.' };
  }

  // ─── Counts ─────────────────────────────────────────────────────────────────

  async countCourseProviders() { return this.courseProviderModel.countDocuments(); }
  async countPendingCourseProviders() { return this.courseProviderModel.countDocuments({ status: 'Pending' }); }
  async countApprovedCourseProviders() { return this.courseProviderModel.countDocuments({ status: 'Approved' }); }
  async countRejectedCourseProviders() { return this.courseProviderModel.countDocuments({ status: 'Rejected' }); }

  // ─── Status ─────────────────────────────────────────────────────────────────

  async getProviderStatus(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');
    return { status: courseProvider.status };
  }

  // ─── Course Details ─────────────────────────────────────────────────────────

  async getCourseDetails(id: string) {
    return this.courseModel
      .findById(id)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('topic', 'name')
      .populate('courseProvider');
  }

  async getCoursesByCategory(categoryId: string, subcategoryId?: string) {
    const query: any = { category: new Types.ObjectId(categoryId) };
    if (subcategoryId) {
      query.subcategory = new Types.ObjectId(subcategoryId);
    }
    return this.courseModel.find(query);
  }

  // ─── Course List (by provider) ───────────────────────────────────────────────

  async getCourseList(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');
    return this.courseModel.find({ courseProvider: courseProvider._id });
  }

  // ─── Enrolled Students ────────────────────────────────────────────────────────

  async getEnrolledStudents(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');

    const courses = await this.courseModel.find({ courseProvider: courseProvider._id });
    const courseIds = courses.map((course) => course._id);
    const students = await this.enrollmentModel
      .find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email')
      .populate('courseId', 'title');
    return students;
  }

  // ─── All Courses / Providers ─────────────────────────────────────────────────

  async getAllCourses() {
    return this.courseModel.find().populate('courseProvider', 'name');
  }

  async getAllCourseProvider() {
    return this.courseProviderModel.find().select('-password -refreshToken');
  }

  async findByEmail(email: string) {
    return this.courseProviderModel.findOne({ email });
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────

  async getProfile(providerId: string) {
    const profile = await this.courseProviderProfile
      .findOne({ courseProvider: providerId })
      .populate('courseProvider', '-password -refreshToken');
    return profile;
  }

  async updateProfile(providerId: string, profileData: any) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');

    const data = {
      courseProvider: courseProvider._id,
      website: profileData.website,
      linkedin: profileData.linkedin,
      bio: profileData.bio,
      certifications: profileData.certifications,
      experience: profileData.experience,
      specialization: profileData.specialization,
      languages: profileData.languages,
      expertiseCategory: profileData.expertiseCategory,
      expertiseSubcategory: profileData.expertiseSubcategory,
      expertiseTopic: profileData.expertiseTopic,
      profilePicture: profileData.profilePicture,
    };

    const getProfile = await this.courseProviderProfile.findOne({ courseProvider: courseProvider._id });
    if (getProfile?._id) {
      // BUG FIX: was findByIdAndUpdate(id, {data}) — wrapped in nested object
      return this.courseProviderProfile.findByIdAndUpdate(getProfile._id, data, { new: true });
    } else {
      return this.courseProviderProfile.create(data);
    }
  }

  // ─── Upload Basic Course Information ────────────────────────────────────────

  async uploadBasicInformation(courseData: any, providerId: string) {
    const category = await this.categoryService.getOne(courseData.category);
    const subcategory = await this.subcategoryService.getOne(courseData.subcategory);
    const topic = await this.topicService.getOne(courseData.topic);

    const courseFields: any = {
      category,
      subcategory,
      topic,
      title: courseData.title,
      description: courseData.description,
      level: courseData.level,
      language: courseData.language,
      duration: courseData.duration,
      price: Number(courseData.price) || 0,
    };

    if (courseData.thumbnailImage) {
      courseFields.thumbnail = courseData.thumbnailImage;
    }
    if (courseData.previewVideo) {
      courseFields.previewVideo = courseData.previewVideo;
    }

    if (courseData.courseId === 'new-course') {
      const courseProvider = await this.courseProviderModel.findById(providerId);
      if (!courseProvider) throw new NotFoundException('Course provider not found.');
      return this.courseModel.create({ ...courseFields, courseProvider: courseProvider._id });
    } else {
      // BUG FIX: was updating courseProviderModel instead of courseModel
      return this.courseModel.findByIdAndUpdate(courseData.courseId, courseFields, { new: true });
    }
  }

  // ─── Ownership Check ──────────────────────────────────────────────────────────

  async verifyCourseOwnership(courseId: string, providerId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found.');
    if (course.courseProvider.toString() !== providerId) {
      throw new ForbiddenException('You do not own this course.');
    }
    return course;
  }

  // ─── Change Status ────────────────────────────────────────────────────────────

  async changeCourseStatus(id: string, status: string) {
    const updateStatus = await this.courseModel.findByIdAndUpdate(id, { approvalStatus: status }, { new: true });
    if (status === 'Approved') {
      const course = await this.courseModel.findById(id);
      const courseProvider = await this.courseProviderModel.findById(course?.courseProvider);
      if (courseProvider?._id) {
        try {
          const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
          await this.mailService.sendMail({
            to: courseProvider.email,
            subject: 'Your Course Has Been Approved!',
            template: 'course-approval',
            context: {
              providerName: courseProvider.name,
              courseTitle: course?.title,
              courseLink: `${frontendUrl}/home`,
            },
          });
          console.log(`✅ Course approval email sent to: ${courseProvider.email}`);
        } catch (mailError) {
          console.error(`❌ Failed to send course approval email to ${courseProvider.email}:`, mailError);
        }
      }
    }
    return updateStatus;
  }

  async changeProviderStatus(id: string, status: string) {
    const updateStatus = await this.courseProviderModel.findByIdAndUpdate(id, { status }, { new: true });
    if (status === 'Approved') {
      const courseProvider = await this.courseProviderModel.findById(id);
      if (courseProvider?._id) {
        try {
          const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
          await this.mailService.sendMail({
            to: courseProvider.email,
            subject: 'Your Account Has Been Approved!',
            template: 'course-provider-approval',
            context: { name: courseProvider.name, dashboardLink: frontendUrl },
          });
          console.log(`✅ Approval email sent to: ${courseProvider.email}`);
        } catch (mailError) {
          console.error(`❌ Failed to send approval email to ${courseProvider.email}:`, mailError);
        }
      }
    }
    return updateStatus;
  }

  // ─── Order Management / Earnings ──────────────────────────────────────────────

  async getProviderOrders(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');

    return this.orderModel
      .find({ providerId: courseProvider._id, paymentStatus: PaymentStatus.SUCCESS })
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getProviderEarningsAnalytics(providerId: string) {
    const courseProvider = await this.courseProviderModel.findById(providerId);
    if (!courseProvider) throw new NotFoundException('Course provider not found.');

    const orders = await this.orderModel.find({
      providerId: courseProvider._id,
      paymentStatus: PaymentStatus.SUCCESS,
    }).populate<{ courseId: any }>('courseId', 'title price');

    const totalEarnings = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const totalOrders = orders.length;

    // Aggregate earning per course
    const courseEarningsMap: Record<string, { title: string; count: number; total: number; courseId: string }> = {};

    orders.forEach((order) => {
      const amount = order.amount || 0;
      const course = order.courseId;
      const courseIdString = course._id.toString();

      if (!courseEarningsMap[courseIdString]) {
        courseEarningsMap[courseIdString] = {
          courseId: courseIdString,
          title: course.title,
          count: 0,
          total: 0,
        };
      }
      courseEarningsMap[courseIdString].count += 1;
      courseEarningsMap[courseIdString].total += amount;
    });

    const coursesBreakdown = Object.values(courseEarningsMap).sort((a, b) => b.total - a.total);

    return {
      totalEarnings,
      totalOrders,
      coursesBreakdown,
    };
  }
}

