import mongoose, { Schema, Document } from "mongoose";

const certificateSchema: Schema = new Schema(
    {
      course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
      student: { type: Schema.Types.ObjectId, ref: "User", required: true },
      dateIssued: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
  const Certificate = mongoose.model("Certificate", certificateSchema);
  
  export default Certificate;
  