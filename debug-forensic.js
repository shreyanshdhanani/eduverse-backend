const mongoose = require('mongoose');
const { Types } = mongoose;

async function run() {
  await mongoose.connect('mongodb+srv://mendercompany:mendercompany@eduverse.umovsou.mongodb.net/lms');
  
  const enrollmentSchema = new mongoose.Schema({}, { strict: false });
  const Enrollment = mongoose.model('Enrollment', enrollmentSchema, 'enrollments');
  
  const targetCourseId = '69d552ae46757b7c9bd719ae';
  
  // Find all enrollments for this course
  const enrollments = await Enrollment.find({ 
    $or: [
      { courseId: targetCourseId },
      { courseId: new Types.ObjectId(targetCourseId) }
    ]
  }).lean();
  
  console.log(`--- ENROLLMENTS for Course ${targetCourseId} ---`);
  enrollments.forEach(e => {
    console.log(`- Enrollment: ${e._id}`);
    console.log(`  User: "${e.userId}" (${typeof e.userId})`);
    console.log(`  Course: "${e.courseId}" (${typeof e.courseId})`);
  });

  process.exit();
}

run().catch(console.error);
