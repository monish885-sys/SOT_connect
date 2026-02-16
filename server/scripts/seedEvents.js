/**
 * Seed random events. Run: cd server && npm run seed:events
 * Requires users to exist (run seed first). Creates mix of past/upcoming, categories, some with registrations.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sotconnect';

const venues = [
  'Main Auditorium, Block A',
  'Tech Lab 3, CS Building',
  'Seminar Hall, Admin Block',
  'Open Amphitheatre',
  'Room 201, ECE Block',
  'Innovation Hub',
  'Conference Room 1',
  'Sports Complex Hall',
];

const eventTemplates = [
  { title: 'Python for Data Science Workshop', category: 'Workshop', tags: ['Python', 'Data Science', 'ML'] },
  { title: 'Annual Hackathon 2025', category: 'Hackathon', tags: ['Coding', 'Innovation'] },
  { title: 'Placements Prep: Aptitude & GD', category: 'Seminar', tags: ['Placements', 'Career'] },
  { title: 'Tech Talk: Cloud & DevOps', category: 'Seminar', tags: ['Cloud', 'DevOps', 'AWS'] },
  { title: 'Cultural Fest - SOT Night', category: 'Cultural', tags: ['Music', 'Dance'] },
  { title: 'Web Development Bootcamp', category: 'Workshop', tags: ['React', 'Node.js', 'Full Stack'] },
  { title: 'AI/ML Hands-on Session', category: 'Workshop', tags: ['Python', 'ML', 'TensorFlow'] },
  { title: 'Startup Pitch Competition', category: 'Hackathon', tags: ['Entrepreneurship', 'Pitch'] },
  { title: 'Industry Connect: IT Giants', category: 'Seminar', tags: ['Placements', 'Industry'] },
  { title: 'Robotics Workshop', category: 'Workshop', tags: ['IoT', 'Embedded'] },
  { title: 'Ethical Hacking Basics', category: 'Workshop', tags: ['Cybersecurity', 'Security'] },
  { title: 'Annual Day Celebrations', category: 'Cultural', tags: ['Cultural', 'Annual'] },
  { title: 'Code Sprint: 24-Hour Challenge', category: 'Hackathon', tags: ['Coding', 'Competition'] },
  { title: 'Resume & Interview Skills', category: 'Seminar', tags: ['Placements', 'Soft Skills'] },
  { title: 'Blockchain & Web3 Intro', category: 'Seminar', tags: ['Blockchain', 'Web3'] },
  { title: 'UI/UX Design Workshop', category: 'Workshop', tags: ['Design', 'Figma'] },
  { title: 'Quiz & Gaming Night', category: 'Cultural', tags: ['Quiz', 'Fun'] },
  { title: 'Open Source Contribution Drive', category: 'Workshop', tags: ['Open Source', 'GitHub'] },
];

const descriptions = [
  'Join us for an interactive session. All students welcome. Bring your laptop.',
  'Learn from industry experts and get hands-on experience. Limited seats.',
  'Network with peers and professionals. Refreshments will be provided.',
  'Part of the SOT initiative to bridge academia and industry.',
  'No prior experience required. Certificates will be issued to participants.',
];

function addDays(d, days) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const students = await User.find({ role: 'student' }).select('_id').lean();
    if (!admins.length) {
      console.log('Run seed (users) first to create at least one admin.');
      process.exit(1);
    }

    const createdBy = admins[0]._id;
    const now = new Date();
    let created = 0;

    for (let i = 0; i < eventTemplates.length; i++) {
      const t = eventTemplates[i];
      const existing = await Event.findOne({ title: t.title }).lean();
      if (existing) {
        console.log('Skip (exists):', t.title);
        continue;
      }

      const daysOffset = i % 3 === 0 ? -randomInt(5, 30) : randomInt(1, 45);
      const eventDate = addDays(now, daysOffset);
      const regStart = addDays(eventDate, -14);
      const regEnd = addDays(eventDate, -1);

      const event = {
        title: t.title,
        description: randomItem(descriptions),
        venue: randomItem(venues),
        venueMapUrl: 'https://www.google.com/maps',
        date: eventDate,
        capacity: randomInt(30, 120),
        category: t.category,
        tags: t.tags,
        coverImageUrl: `https://picsum.photos/seed/${encodeURIComponent(t.title)}/800/400`,
        registrationStart: regStart,
        registrationEnd: regEnd,
        unregisterDeadlineHours: randomItem([12, 24, 48]),
        isDraft: i % 5 === 0,
        createdBy,
        registeredUsers: [],
        waitlist: [],
      };

      const doc = await Event.create(event);
      created++;

      if (students.length && eventDate > now && !event.isDraft && created <= 6) {
        const numReg = Math.min(randomInt(2, students.length), Math.floor(doc.capacity * 0.4));
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        doc.registeredUsers = shuffled.slice(0, numReg).map((s) => s._id);
        await doc.save();
      }

      console.log('Created:', t.title, `(${event.isDraft ? 'draft' : 'published'})`);
    }

    console.log(`\nDone. Created ${created} events.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
