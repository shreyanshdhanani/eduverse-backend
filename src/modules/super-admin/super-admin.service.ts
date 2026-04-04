import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { CourseProviderService } from '../course-provider/course-provider.service';
import { UniversityAdminService } from '../university-admin/university-admin.service';
import { CategoryService } from '../category/category.service';
import { SubCategoryService } from '../sub-category/sub-category.service';
import { TopicService } from '../topic/topic.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schema/student.schema';
import { Model } from 'mongoose';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Order } from 'src/schema/order.schema';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly studentService: StudentService,
    private readonly courseProviderService: CourseProviderService,
    private readonly universityAdminService: UniversityAdminService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubCategoryService,
    private readonly topicService: TopicService,
  ) {}

  async dashboard() {
    const countUser = await this.studentService.countStudent();
    const countCourseProviders = await this.courseProviderService.countCourseProviders();
    const countPendingCourseProviders = await this.courseProviderService.countPendingCourseProviders();
    const countApprovedCourseProviders = await this.courseProviderService.countApprovedCourseProviders();
    const countRejectedCourseProviders = await this.courseProviderService.countRejectedCourseProviders();
    const countPendingUniversities = await this.universityAdminService.countPendingUniversities();
    const countApprovedUniversities = await this.universityAdminService.countApprovedUniversities();
    const countRejectedUniversities = await this.universityAdminService.countRejectedUniversities();
    const countUniversity = await this.universityAdminService.countUniversity();
    const countCategories = await this.categoryService.countCategories();
    const countSubcategories = await this.subcategoryService.countSubcategories();
    const countTopics = await this.topicService.countTopics();
    const totalOrders = await this.orderModel.countDocuments();
    const totalRevenue = await this.orderModel.aggregate([
      { $match: { paymentStatus: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      countUser,
      countCourseProviders,
      countPendingCourseProviders,
      countApprovedCourseProviders,
      countRejectedCourseProviders,
      countPendingUniversities,
      countApprovedUniversities,
      countRejectedUniversities,
      countUniversity,
      countCategories,
      countSubcategories,
      countTopics,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }

  async getFullEnrollmentDetailsByUser(userId: string) {
    return this.enrollmentModel
      .find({ userId })
      .populate('courseId', 'title price thumbnail')
      .lean();
  }

  async getAllOrders() {
    return this.orderModel
      .find()
      .populate('userId', 'name email')
      .populate('courseId', 'title price')
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }
}
