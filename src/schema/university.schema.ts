import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

// Enum for approval status
export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Schema({ versionKey: false, timestamps: true })
export class University extends Document {
  @Prop({ required: true })
  universityName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ type: String, required: false })
  website: string;

  @Prop({ type: String, required: false })
  logo: string; // Path to the logo image file

  // New field to track approval status
  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus;
}

// Create the schema directly
export const UniversitySchema = SchemaFactory.createForClass(University);

// Hash the password before saving the document (pre-save hook)
UniversitySchema.pre('save', async function(next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
  }
  next();
});
