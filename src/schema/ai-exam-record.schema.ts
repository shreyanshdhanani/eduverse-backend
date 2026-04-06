import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema()
export class ExamQuestion {
  @Prop({ required: true })
  questionText: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ required: true })
  userAnswer: string;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop()
  explanation: string;
}

@Schema({ versionKey: false, timestamps: true })
export class AIExamRecord extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  examId: string;

  @Prop()
  category: string;

  @Prop()
  subcategory: string;

  @Prop()
  topic: string;

  @Prop({ required: true })
  difficultyLevel: number;

  @Prop({ required: true })
  totalMarks: number;

  @Prop({ required: true })
  marksObtained: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ required: true })
  grade: string;

  @Prop({ required: true })
  timeTaken: number; // In seconds

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  correctAnswers: number;

  @Prop({ required: true })
  wrongAnswers: number;

  @Prop({ required: true })
  skippedAnswers: number;

  @Prop({ type: [ExamQuestion], default: [] })
  questions: ExamQuestion[];

  @Prop()
  aiFeedback: string;
}

export const AIExamRecordSchema = SchemaFactory.createForClass(AIExamRecord);
