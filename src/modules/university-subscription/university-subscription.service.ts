import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan } from 'src/schema/subscription-plan.schema';
import { Subscription } from 'src/schema/university-subscription.schema';
import { University } from 'src/schema/university.schema';
import { User } from 'src/schema/student.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import {
  AssignPlanDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './university-subscription.dto';

@Injectable()
export class UniversitySubscriptionService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlan>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(University.name)
    private universityModel: Model<University>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<Enrollment>,
  ) {}

  // ─── Plan Template CRUD ───────────────────────────────────────────────────────

  async createPlan(dto: CreateSubscriptionPlanDto) {
    return this.planModel.create(dto);
  }

  async getAllPlans() {
    return this.planModel.find().sort({ createdAt: -1 });
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.planModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  async deletePlan(id: string) {
    const plan = await this.planModel.findByIdAndDelete(id);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return { message: 'Plan deleted successfully' };
  }

  // ─── Assign a Plan to a University ───────────────────────────────────────────

  async assignPlan(dto: AssignPlanDto) {
    const { universityId, planId, durationDays } = dto;

    const university = await this.universityModel.findById(universityId);
    if (!university) throw new NotFoundException('University not found');

    const plan = await this.planModel.findById(planId);
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { university: new Types.ObjectId(universityId) },
      {
        planName: plan.planName,
        price: plan.price,
        maxStudents: plan.maxStudents,
        maxCoursesPerStudent: plan.maxCoursesPerStudent,
        planRef: plan._id,
        university: new Types.ObjectId(universityId),
        startDate,
        endDate,
        isActive: true,
      },
      { upsert: true, new: true },
    );

    return {
      message: `Plan "${plan.planName}" assigned to ${university.universityName} for ${durationDays} days`,
      subscription,
    };
  }

  // ─── Get Subscription for a University ───────────────────────────────────────

  async getSubscriptionByUniversity(universityId: string) {
    const subscription = await this.subscriptionModel.findOne({
      university: new Types.ObjectId(universityId),
    });
    if (!subscription) {
      return { hasSubscription: false, message: 'No active subscription found for this university' };
    }

    // Auto-deactivate if expired
    if (subscription.endDate && new Date() > subscription.endDate) {
      subscription.isActive = false;
      await subscription.save();
    }

    return { hasSubscription: true, subscription };
  }

  // ─── Get Usage Stats for a University ────────────────────────────────────────

  async getUsageStats(universityId: string) {
    const subscription = await this.subscriptionModel.findOne({
      university: new Types.ObjectId(universityId),
    });

    if (!subscription) {
      return { hasSubscription: false };
    }

    const studentsAdded = await this.userModel.countDocuments({
      universityId: new Types.ObjectId(universityId),
    });

    const students = await this.userModel
      .find({ universityId: new Types.ObjectId(universityId) })
      .select('_id');
    const studentIds = students.map((s) => s._id);

    const totalEnrollments = await this.enrollmentModel.countDocuments({
      userId: { $in: studentIds },
      isUniversityStudent: true,
    });

    const daysRemaining = subscription.endDate
      ? Math.max(0, Math.ceil((subscription.endDate.getTime() - Date.now()) / 86400000))
      : null;

    return {
      hasSubscription: true,
      planName: subscription.planName,
      price: subscription.price,
      maxStudents: subscription.maxStudents,
      maxCoursesPerStudent: subscription.maxCoursesPerStudent,
      studentsAdded,
      seatsRemaining: subscription.maxStudents - studentsAdded,
      totalEnrollments,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining,
      isActive: subscription.isActive,
    };
  }

  // ─── Check if a student can get free enrollment ───────────────────────────────

  async checkFreeEnrollmentEligibility(studentId: string) {
    const student = await this.userModel.findById(studentId);
    if (!student || !student.universityId) {
      return { eligible: false, reason: 'Not a university student' };
    }

    const subscription = await this.subscriptionModel.findOne({
      university: student.universityId,
      isActive: true,
    });

    if (!subscription) {
      return { eligible: false, reason: 'University has no active subscription' };
    }

    if (subscription.endDate && new Date() > subscription.endDate) {
      return { eligible: false, reason: 'University subscription has expired' };
    }

    const studentsAdded = await this.userModel.countDocuments({
      universityId: student.universityId,
    });

    if (studentsAdded > subscription.maxStudents) {
      return { eligible: false, reason: 'University has exceeded student seat limit' };
    }

    if (student.freeCoursesUsed >= subscription.maxCoursesPerStudent) {
      return {
        eligible: false,
        reason: `You have used all ${subscription.maxCoursesPerStudent} free course slots`,
      };
    }

    return {
      eligible: true,
      freeCoursesUsed: student.freeCoursesUsed,
      maxCoursesPerStudent: subscription.maxCoursesPerStudent,
      slotsRemaining: subscription.maxCoursesPerStudent - student.freeCoursesUsed,
    };
  }

  // ─── Dashboard summary for super admin ───────────────────────────────────────

  async getSuperAdminSubscriptionStats() {
    const totalPlans = await this.planModel.countDocuments();
    const activePlans = await this.planModel.countDocuments({ isActive: true });
    const totalSubscriptions = await this.subscriptionModel.countDocuments();
    const activeSubscriptions = await this.subscriptionModel.countDocuments({ isActive: true });

    return { totalPlans, activePlans, totalSubscriptions, activeSubscriptions };
  }
}
