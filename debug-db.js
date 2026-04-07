const mongoose = require('mongoose');
const { Types } = mongoose;

async function run() {
  await mongoose.connect('mongodb+srv://mendercompany:mendercompany@eduverse.umovsou.mongodb.net/lms');
  
  const enrollmentSchema = new mongoose.Schema({}, { strict: false });
  const Enrollment = mongoose.model('Enrollment', enrollmentSchema, 'enrollments');
  
  const docs = await Enrollment.find().limit(5).lean();
  console.log('--- SAMPLE ENROLLMENTS ---');
  docs.forEach(d => {
    console.log(`ID: ${d._id} | User: ${d.userId} (${typeof d.userId}) | Course: ${d.courseId} (${typeof d.courseId})`);
  });

  // Also check if any enrollments exist at all
  const count = await Enrollment.countDocuments();
  console.log(`Total Enrollments: ${count}`);

  process.exit();
}

run().catch(console.error);
