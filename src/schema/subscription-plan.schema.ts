import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class SubscriptionPlan extends Document {
  @Prop({ required: true })
  planName: string;

  @Prop({ required: true })
  price: number; // in USD

  @Prop({ required: true })
  maxStudents: number; // total seats for the university

  @Prop({ required: true })
  maxCoursesPerStudent: number; // free course limit per student

  @Prop({ default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
