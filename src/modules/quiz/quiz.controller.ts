import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Post('generate')
    async generateQuiz(
      @Body('title') title: string,
      @Body('description') description: string,
      @Body('level') level: string,
    ) {
      if (!title || !description || !level) {
        throw new BadRequestException('Course title, description, and level are required for exam generation.');
      }
  
      const quiz = await this.quizService.generateQuiz(title, description, level);
      return { title, level, quiz };
    }
}
