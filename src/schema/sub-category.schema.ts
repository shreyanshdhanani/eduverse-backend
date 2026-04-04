import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class SubCategory extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  category: Types.ObjectId;
  
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);
