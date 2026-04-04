const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.development') });

const dbUrl = process.env.DB_URL;
console.log(`Testing connection to: "${dbUrl}"`);

mongoose.connect(dbUrl)
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error(err);
    process.exit(1);
  });
