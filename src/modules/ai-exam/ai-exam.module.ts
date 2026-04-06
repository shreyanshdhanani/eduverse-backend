import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIExamController } from './ai-exam.controller';
import { AIExamService } from './ai-exam.service';
import { AIExamRecord, AIExamRecordSchema } from 'src/schema/ai-exam-record.schema';
import { Category, CategorySchema } from 'src/schema/category.schema';
import { SubCategory, SubCategorySchema } from 'src/schema/sub-category.schema';
import { Topic, TopicSchema } from 'src/schema/topic.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: AIExamRecord.name, schema: AIExamRecordSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
  ],
  controllers: [AIExamController],
  providers: [AIExamService],
  exports: [AIExamService],
})
export class AIExamModule {}
