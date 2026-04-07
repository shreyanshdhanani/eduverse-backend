import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/common/enums/role.enum';

@Schema({ versionKey: false, timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: string;

  @Prop()
  refreshToken: string;

  @Prop({ type: Types.ObjectId, ref: 'University' })
  universityId: Types.ObjectId;

  @Prop({ default: 0 })
  freeCoursesUsed: number;

  @Prop({ default: false })
  mustChangePassword: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
