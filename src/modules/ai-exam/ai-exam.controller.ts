import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AIExamService } from './ai-exam.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('ai-exam')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIExamController {
  constructor(private readonly aiExamService: AIExamService) {}

  @Get('setup-data')
  @Roles(Role.USER)
  async getSetupData() {
    return this.aiExamService.getSetupData();
  }

  @Post('save-result')
  @Roles(Role.USER)
  async saveResult(@CurrentUser() user: any, @Body() resultData: any) {
    return this.aiExamService.saveResult(user._id, resultData);
  }

  @Get('history')
  @Roles(Role.USER)
  async getHistory(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('grade') grade?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.aiExamService.getHistory(user._id, { category, grade, difficulty });
  }

  @Get('history/:examId')
  @Roles(Role.USER)
  async getExamDetails(@CurrentUser() user: any, @Param('examId') examId: string) {
    return this.aiExamService.getExamById(examId, user._id);
  }
}
