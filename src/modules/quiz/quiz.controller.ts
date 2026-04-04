import { Controller, Get, Param, Query } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Get(':topic')
    async getQuiz(@Param('topic') topic: string) {
      console.log('topic', topic)
      if (!topic) {
        return new Error("topic is required")
      }
  
      const quiz = await this.quizService.generateQuiz(topic);
      return { topic, quiz };
    }
}
