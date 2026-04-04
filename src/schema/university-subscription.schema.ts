import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({versionKey: false, timestamps: true})
export class Subscription extends Document{
    @Prop()
    plan: string;

    @Prop({type: Types.ObjectId, ref: "University", required: true, unique: true})
    university: Types.ObjectId;
}
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)

