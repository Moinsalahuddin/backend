// Quick MongoDB Connection Test
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxurystay';

console.log('Testing MongoDB Connection...');
console.log('Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('\n✅ MongoDB Connected Successfully!');
  console.log('✅ Database:', mongoose.connection.name);
  console.log('✅ Host:', mongoose.connection.host);
  process.exit(0);
})
.catch((error) => {
  console.error('\n❌ MongoDB Connection Failed!');
  console.error('Error:', error.message);
  
  if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
    console.error('\n🔍 Possible Issues:');
    console.error('1. Database user not created in MongoDB Atlas');
    console.error('2. Incorrect username or password');
    console.error('3. Password contains special characters that need URL encoding');
    console.error('\n📝 Solution:');
    console.error('1. Go to MongoDB Atlas → Database Access');
    console.error('2. Verify user exists or create new user');
    console.error('3. Update .env file with correct credentials');
  }
  
  process.exit(1);
});

