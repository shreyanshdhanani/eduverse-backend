import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] })
  courseIds: Types.ObjectId[];

  @Prop()
  amountPaid: number;

  @Prop()
  stripeSessionId: string;

  @Prop()
  status: string; // 'success', 'failed'

  @Prop()
  invoicePdfUrl: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
