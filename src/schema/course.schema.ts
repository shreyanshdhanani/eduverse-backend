import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Section } from "./section.schema";

// Enum for approval status
export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Schema({ versionKey: false, timestamps: true })
export class Course extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "SubCategory", required: true })
  subcategory: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Topic", required: true })
  topic: Types.ObjectId;

  @Prop({ required: true })
  level: string;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  duration: number; // in hours

  @Prop({ default: 0 })
  price: number; // course price in base currency unit

  @Prop()
  thumbnail: string; // URL to image

  @Prop()
  previewVideo: string; // URL to preview video

  @Prop({ type: Types.ObjectId, ref: "CourseProvider", required: true })
  courseProvider: Types.ObjectId;

  @Prop({ type: [Section], default: [] })
  sections: Section[];

  @Prop({ default: false })
  certificateAvailable: boolean;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
