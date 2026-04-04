import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class Enrollment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ default: false })
  isUniversityStudent: boolean;

  @Prop({ default: 'enrolled' }) // optional: you could use 'completed', 'in-progress', etc.
  status: string;

  @Prop({ default: 0 })
  progress: number; // percentage like 0-100

  @Prop({ default: false })
  certificateIssued: boolean;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
