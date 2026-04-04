import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({versionKey: false, timestamps: true})
export class Topic extends Document{
    @Prop({required: true, unique: true})
    name: string;

    @Prop()
    description: string;

    @Prop({type: Types.ObjectId, ref: "SubCategory", required: true})
    subCategory: Types.ObjectId;
}
export const TopicSchema = SchemaFactory.createForClass(Topic)

