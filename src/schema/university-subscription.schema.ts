import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class Subscription extends Document {
  @Prop({ required: true })
  planName: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  maxStudents: number;

  @Prop({ required: true })
  maxCoursesPerStudent: number;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan' })
  planRef: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true, unique: true })
  university: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: String })
  stripeSessionId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
