import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/common/enums/role.enum';

@Schema({ versionKey: false, timestamps: true })
export class SuperAdmin extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, default: Role.SUPER_ADMIN })
  role: string;

  @Prop()
  refreshToken: string;

  @Prop()
  lastLogin: Date;
}

export const SuperAdminSchema = SchemaFactory.createForClass(SuperAdmin);

SuperAdminSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
