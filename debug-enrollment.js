const mongoose = require('mongoose');
const { Types } = mongoose;

async function run() {
  await mongoose.connect('mongodb+srv://mendercompany:mendercompany@eduverse.umovsou.mongodb.net/lms');
  
  const enrollmentSchema = new mongoose.Schema({}, { strict: false });
  const Enrollment = mongoose.model('Enrollment', enrollmentSchema, 'enrollments');
  
  const targetCourseId = '69d552ae46757b7c9bd719ae';
  
  const enrollments = await Enrollment.find({ courseId: { $in: [targetCourseId, new Types.ObjectId(targetCourseId)] } }).lean();
  
  console.log(`--- ENROLLMENTS for Course ${targetCourseId} ---`);
  console.log(`Found: ${enrollments.length}`);
  enrollments.forEach(e => {
    console.log(`ID: ${e._id} | User: ${e.userId} (${typeof e.userId}) | Course: ${e.courseId} (${typeof e.courseId})`);
  });

  process.exit();
}

run().catch(console.error);
