import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UniversitySubscriptionService } from './university-subscription.service';
import {
  AssignPlanDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './university-subscription.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscription-plans')
export class UniversitySubscriptionController {
  constructor(
    private readonly subscriptionService: UniversitySubscriptionService,
  ) {}

  // ─── Plan Templates ───────────────────────────────────────────────────────────

  @Roles(Role.SUPER_ADMIN)
  @Post()
  async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.UNIVERSITY)
  @Get()
  async getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  // ─── Assign Plan to University ────────────────────────────────────────────────

  @Roles(Role.SUPER_ADMIN)
  @Post('assign')
  async assignPlan(@Body() dto: AssignPlanDto) {
    return this.subscriptionService.assignPlan(dto);
  }

  // ─── Get Subscription for a University (by ID) ────────────────────────────────

  @Roles(Role.SUPER_ADMIN, Role.UNIVERSITY)
  @Get('university/:universityId')
  async getSubscriptionByUniversity(
    @Param('universityId') universityId: string,
  ) {
    return this.subscriptionService.getSubscriptionByUniversity(universityId);
  }

  // ─── Get Usage Stats (Super Admin view) ──────────────────────────────────────

  @Roles(Role.SUPER_ADMIN, Role.UNIVERSITY)
  @Get('usage/:universityId')
  async getUsageStats(@Param('universityId') universityId: string) {
    return this.subscriptionService.getUsageStats(universityId);
  }

  // ─── Check student free enrollment eligibility ────────────────────────────────

  @Roles(Role.SUPER_ADMIN, Role.UNIVERSITY)
  @Get('eligibility/:studentId')
  async checkEligibility(@Param('studentId') studentId: string) {
    return this.subscriptionService.checkFreeEnrollmentEligibility(studentId);
  }

  // ─── Super Admin stats ────────────────────────────────────────────────────────

  @Roles(Role.SUPER_ADMIN)
  @Get('stats/summary')
  async getSummaryStats() {
    return this.subscriptionService.getSuperAdminSubscriptionStats();
  }
}
