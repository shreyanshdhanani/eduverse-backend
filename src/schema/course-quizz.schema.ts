import mongoose, { Schema, Document } from "mongoose";

const quizSchema: Schema = new Schema(
    {
      title: { type: String, required: true },
      questions: [
        {
          question: { type: String, required: true },
          options: [
            { type: String, required: true },
          ],
          correctAnswer: { type: String, required: true },
        },
      ],
      course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    },
    { timestamps: true }
  );
  
  const Quiz = mongoose.model("Quiz", quizSchema);
  
  export default Quiz;
  