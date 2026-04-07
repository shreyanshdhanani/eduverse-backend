import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class CourseCertificate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseProvider', required: true })
  courseProviderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', default: null })
  universityId: Types.ObjectId;

  // Snapshot fields so certificate stays valid even if related docs change
  @Prop({ required: true })
  courseTitle: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ required: true })
  providerName: string;

  @Prop({ default: Date.now })
  issuedAt: Date;
}

export const CourseCertificateSchema = SchemaFactory.createForClass(CourseCertificate);