import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CourseProvider } from './course-provider.schema';

@Schema({ versionKey: false, timestamps: true })
export class CourseProviderProfile extends Document {
  @Prop({ type: Types.ObjectId, ref: 'CourseProvider', required: true, unique: true })
  courseProvider: Types.ObjectId;

  @Prop()
  website?: string;

  @Prop()
  linkedin?: string;

  @Prop()
  bio?: string;

  @Prop()
  certifications?: string;

  @Prop()
  experience?: string;

  @Prop()
  specialization?: string;

  @Prop()
  languages?: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  expertiseCategory?: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: "SubCategory", required: true})
  expertiseSubcategory?:  Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: "Topic", required: true})
  expertiseTopic?: Types.ObjectId;

  @Prop()
  profilePicture?: string;
}

export const CourseProviderProfileSchema = SchemaFactory.createForClass(CourseProviderProfile);
