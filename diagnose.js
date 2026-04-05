const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '.env.development') });

const dbUrl = process.env.DB_URL;
const mailHost = process.env.MAIL_HOST;
const mailPort = process.env.MAIL_PORT;
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

async function check() {
  console.log('--- Database Check ---');
  await mongoose.connect(dbUrl);
  console.log('✅ DB Connected');

  // We don't have the schemas here, so we use anonymous models or query the collection directly
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log('Collections:', collectionNames);

  if (collectionNames.includes('universities')) {
    const pendingUniv = await mongoose.connection.db.collection('universities').countDocuments({ approvalStatus: 'Pending' });
    const approvedUniv = await mongoose.connection.db.collection('universities').countDocuments({ approvalStatus: 'Approved' });
    console.log(`Universities: ${pendingUniv} Pending, ${approvedUniv} Approved`);
  }

  if (collectionNames.includes('courseproviders')) {
    const pendingProv = await mongoose.connection.db.collection('courseproviders').countDocuments({ status: 'Pending' });
    const approvedProv = await mongoose.connection.db.collection('courseproviders').countDocuments({ status: 'Approved' });
    const approvedProvLower = await mongoose.connection.db.collection('courseproviders').countDocuments({ status: 'approved' });
    console.log(`Course Providers: ${pendingProv} Pending, ${approvedProv} Approved, ${approvedProvLower} approved (lowercase)`);
  }

  console.log('\n--- Mail Check ---');
  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: parseInt(mailPort),
    secure: false, // 587
    auth: {
      user: mailUser,
      pass: mailPass
    },
    tls: {
        rejectUnauthorized: false
    }
  });

  try {
    console.log(`Trying to verify transport for ${mailUser}@${mailHost}:${mailPort}...`);
    await transporter.verify();
    console.log('✅ Mail Transport Verified!');
  } catch (err) {
    console.error('❌ Mail Transport Failed:');
    console.error(err);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
