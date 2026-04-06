import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIExamRecord } from 'src/schema/ai-exam-record.schema';
import { Category } from 'src/schema/category.schema';
import { SubCategory } from 'src/schema/sub-category.schema';
import { Topic } from 'src/schema/topic.schema';

@Injectable()
export class AIExamService {
  constructor(
    @InjectModel(AIExamRecord.name) private examRecordModel: Model<AIExamRecord>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
  ) {}

  // ─── Hierarchy Fetch ────────────────────────────────────────────────────────

  async getSetupData() {
    // Fetch all categories, subcategories, and topics
    const [categories, subcategories, topics] = await Promise.all([
      this.categoryModel.find().lean(),
      this.subCategoryModel.find().lean(),
      this.topicModel.find().lean(),
    ]);

    // Build the hierarchy: Category -> SubCategories -> Topics
    return categories.map(cat => {
      const catSubcategories = subcategories.filter(sub => 
        (sub as any).category?.toString() === (cat as any)._id?.toString()
      ).map(sub => ({
        ...sub,
        topics: topics.filter(t => (t as any).subCategory?.toString() === (sub as any)._id?.toString())
      }));

      return {
        ...cat,
        subcategories: catSubcategories
      };
    });
  }

  // ─── Save Result ────────────────────────────────────────────────────────────

  async saveResult(userId: string, resultData: any) {
    const examRecord = new this.examRecordModel({
      ...resultData,
      userId,
      examId: `EXAM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    });
    return examRecord.save();
  }

  // ─── Get History ────────────────────────────────────────────────────────────

  async getHistory(userId: string, filters: any = {}) {
    const query: any = { userId };
    
    if (filters.category) query.category = filters.category;
    if (filters.grade) query.grade = filters.grade;
    if (filters.difficulty) query.difficultyLevel = Number(filters.difficulty);

    return this.examRecordModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async getExamById(examId: string, userId: string) {
    const record = await this.examRecordModel.findOne({ examId, userId }).lean();
    if (!record) throw new NotFoundException('Exam record not found');
    return record;
  }
}
