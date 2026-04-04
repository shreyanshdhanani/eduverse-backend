import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[ConfigModule],
  providers: [QuizService],
  controllers: [QuizController]
})
export class QuizModule {}
