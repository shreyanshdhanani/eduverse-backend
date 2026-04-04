import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class Category extends Document {
  
  @Prop({ required: false, unique: true })
  name: string;

  @Prop()
  description: string;

}

export const CategorySchema = SchemaFactory.createForClass(Category);
