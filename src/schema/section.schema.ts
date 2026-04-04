// section.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Section extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  videos: string[]; // URLs or paths for videos

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SectionSchema = SchemaFactory.createForClass(Section);
