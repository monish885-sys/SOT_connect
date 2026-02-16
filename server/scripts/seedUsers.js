/**
 * Seed 5 test users (2 admins, 3 students). Run: node server/scripts/seedUsers.js
 * All passwords: password123
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sotconnect';

const testUsers = [
  { name: 'Admin One', email: 'admin1@sot.edu', password: 'password123', role: 'admin' },
  { name: 'Admin Two', email: 'admin2@sot.edu', password: 'password123', role: 'admin' },
  { name: 'Student Alpha', email: 'student1@sot.edu', password: 'password123', role: 'student', studentId: 'SOT2024001', department: 'CSE' },
  { name: 'Student Beta', email: 'student2@sot.edu', password: 'password123', role: 'student', studentId: 'SOT2024002', department: 'IT' },
  { name: 'Student Gamma', email: 'student3@sot.edu', password: 'password123', role: 'student', studentId: 'SOT2024003', department: 'ECE' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const u of testUsers) {
      const { password, ...rest } = u;
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log('Already exists:', u.email);
        continue;
      }
      await User.create(u);
      console.log('Created:', u.email, `(${u.role})`);
    }

    console.log('\nDone. You can login with any of these (password: password123):');
    testUsers.forEach((u) => console.log('  ', u.email));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
