import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import EventReminder from '../models/EventReminder.js';
import User from '../models/User.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';

const defaultPopulate = [
  { path: 'registeredUsers', select: 'name email studentId department' },
  { path: 'waitlist', select: 'name email' },
  { path: 'createdBy', select: 'name email' },
];

function buildListQuery(req) {
  const { q, category, tags, startDate, endDate, hasSeats, registeredByMe, sort = 'date', past, isDraft } = req.query;
  const filter = {};

  if (past !== 'true') filter.date = { $gte: new Date() };
  if (req.user?.role !== 'admin' && isDraft !== 'true') filter.isDraft = false;

  if (q && q.trim()) {
    filter.$or = [
      { title: new RegExp(q.trim(), 'i') },
      { description: new RegExp(q.trim(), 'i') },
      { venue: new RegExp(q.trim(), 'i') },
      { tags: new RegExp(q.trim(), 'i') },
    ];
  }
  if (category) filter.category = category;
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length) filter.tags = { $in: tagList };
  }
  if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
  if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

  let qry = Event.find(filter).populate(defaultPopulate);

  if (hasSeats === 'true') {
    qry = qry.where('$expr').lt([{ $size: '$registeredUsers' }, '$capacity']);
  }
  if (registeredByMe === 'true' && req.user) {
    qry = qry.where('registeredUsers').equals(req.user._id);
  }

  const sortMap = { date: { date: 1 }, popularity: { registeredCount: -1 }, title: { title: 1 } };
  qry = qry.sort(sortMap[sort] || { date: 1 });
  return qry;
}

export const getEvents = async (req, res, next) => {
  try {
    const events = await buildListQuery(req).lean();
    res.json(events);
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate(defaultPopulate)
      .lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.isDraft && req.user?.role !== 'admin') return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

export const getRelatedEvents = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const related = await Event.find({
      _id: { $ne: event._id },
      isDraft: false,
      date: { $gte: new Date() },
      $or: [
        { category: event.category },
        { tags: { $in: event.tags || [] } },
      ],
    })
      .limit(6)
      .populate(defaultPopulate)
      .lean();
    res.json(related);
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user._id,
    });
    const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(defaultPopulate)
      .lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

export const duplicateEvent = async (req, res, next) => {
  try {
    const original = await Event.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Event not found' });
    const { newDate } = req.body;
    const { registeredUsers, waitlist, createdBy, _id, __v, createdAt, updatedAt, ...rest } = original;
    const event = await Event.create({
      ...rest,
      date: newDate ? new Date(newDate) : new Date(original.date),
      registeredUsers: [],
      waitlist: [],
      isDraft: true,
      createdBy: req.user._id,
    });
    const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const bulkUpdateEvents = async (req, res, next) => {
  try {
    const { action, eventIds } = req.body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ message: 'eventIds array required' });
    }
    if (action === 'delete') {
      await Event.deleteMany({ _id: { $in: eventIds } });
      return res.json({ message: `${eventIds.length} event(s) deleted` });
    }
    if (action === 'publish') {
      await Event.updateMany({ _id: { $in: eventIds } }, { isDraft: false });
      return res.json({ message: `${eventIds.length} event(s) published` });
    }
    if (action === 'unpublish') {
      await Event.updateMany({ _id: { $in: eventIds } }, { isDraft: true });
      return res.json({ message: `${eventIds.length} event(s) unpublished` });
    }
    res.status(400).json({ message: 'Invalid action. Use publish, unpublish, or delete' });
  } catch (err) {
    next(err);
  }
};

function isWithinRegistrationWindow(event) {
  const now = new Date();
  if (event.registrationStart && now < new Date(event.registrationStart)) return false;
  if (event.registrationEnd && now > new Date(event.registrationEnd)) return false;
  return true;
}

function isPastUnregisterDeadline(event) {
  if (!event.unregisterDeadlineHours) return false;
  const deadline = new Date(event.date);
  deadline.setHours(deadline.getHours() - event.unregisterDeadlineHours);
  return new Date() > deadline;
}

export const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!isWithinRegistrationWindow(event)) {
      return res.status(400).json({ message: 'Registration is not open for this event' });
    }
    if (event.registeredUsers.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already registered' });
    }
    if (event.waitlist.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already on waitlist' });
    }

    const full = event.registeredUsers.length >= event.capacity;
    if (full) {
      event.waitlist.push(req.user._id);
      await event.save();
      const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
      return res.status(201).json({ ...populated, onWaitlist: true, message: 'Added to waitlist' });
    }

    event.registeredUsers.push(req.user._id);
    await event.save();

    const { remindOneDayBefore } = req.body || {};
    if (remindOneDayBefore && event.date) {
      const remindAt = new Date(event.date);
      remindAt.setDate(remindAt.getDate() - 1);
      await EventReminder.findOneAndUpdate(
        { event: event._id, user: req.user._id },
        { remindAt, sent: false },
        { upsert: true }
      );
    }

    const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const unregisterFromEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (isPastUnregisterDeadline(event)) {
      return res.status(400).json({ message: 'Unregister deadline has passed' });
    }

    const wasRegistered = event.registeredUsers.some((id) => id.toString() === req.user._id.toString());
    if (!wasRegistered) {
      event.waitlist = event.waitlist.filter((id) => id.toString() !== req.user._id.toString());
      await event.save();
      const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
      return res.json({ ...populated, message: 'Removed from waitlist' });
    }

    event.registeredUsers = event.registeredUsers.filter((id) => id.toString() !== req.user._id.toString());
    const nextFromWaitlist = event.waitlist.shift();
    if (nextFromWaitlist) {
      event.registeredUsers.push(nextFromWaitlist);
    }
    await event.save();

    await EventReminder.findOneAndDelete({ event: event._id, user: req.user._id });

    const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
    res.json({ ...populated, promotedFromWaitlist: !!nextFromWaitlist });
  } catch (err) {
    next(err);
  }
};

export const joinWaitlist = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!isWithinRegistrationWindow(event)) {
      return res.status(400).json({ message: 'Registration is not open for this event' });
    }
    if (event.registeredUsers.length < event.capacity) {
      return res.status(400).json({ message: 'Event has seats. Use register instead.' });
    }
    if (event.waitlist.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already on waitlist' });
    }
    event.waitlist.push(req.user._id);
    await event.save();
    const populated = await Event.findById(event._id).populate(defaultPopulate).lean();
    res.status(201).json({ ...populated, onWaitlist: true });
  } catch (err) {
    next(err);
  }
};

export const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'name email studentId department phone')
      .lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const attendances = await Attendance.find({ event: event._id }).lean();
    const checkedInIds = new Set(attendances.map((a) => a.user.toString()));
    const registrations = (event.registeredUsers || []).map((u) => ({
      ...u,
      checkedIn: checkedInIds.has(u._id.toString()),
    }));
    res.json({
      registrations,
      waitlist: event.waitlist || [],
      event: { title: event.title, date: event.date },
    });
  } catch (err) {
    next(err);
  }
};

export const exportRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'name email studentId department phone')
      .lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const attendances = await Attendance.find({ event: event._id })
      .populate('user', 'name email studentId')
      .lean();
    const checkedInMap = new Map(attendances.map((a) => [a.user._id.toString(), a.checkedInAt]));

    const headers = ['Name', 'Email', 'Student ID', 'Department', 'Phone', 'Checked In At'];
    const rows = (event.registeredUsers || []).map((u) => [
      u.name,
      u.email,
      u.studentId || '',
      u.department || '',
      u.phone || '',
      checkedInMap.get(u._id.toString()) ? new Date(checkedInMap.get(u._id.toString())).toISOString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${(event.title || 'registrations').replace(/[^a-z0-9]/gi, '_')}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    let uid = req.body.userId;
    const eventId = req.params.id;
    const code = req.body.code;
    if (code) {
      const parts = code.split(':');
      if (parts.length !== 3) return res.status(400).json({ message: 'Invalid code format' });
      const [evId, userId, sig] = parts;
      if (evId !== eventId) return res.status(400).json({ message: 'Code does not match this event' });
      const expected = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret').update(`${evId}:${userId}`).digest('hex').slice(0, 8);
      if (sig !== expected) return res.status(400).json({ message: 'Invalid code' });
      uid = userId;
    }
    if (!uid) return res.status(400).json({ message: 'userId or code required' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const isRegistered = event.registeredUsers.some((id) => id.toString() === uid);
    if (!isRegistered) return res.status(400).json({ message: 'User is not registered for this event' });
    await Attendance.findOneAndUpdate(
      { event: eventId, user: uid },
      { checkedInAt: new Date() },
      { upsert: true }
    );
    const user = await User.findById(uid).select('name email').lean();
    res.json({ message: 'Checked in', user });
  } catch (err) {
    next(err);
  }
};

export const getCheckInCode = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const isRegistered = event.registeredUsers?.some((id) => id.toString() === req.user._id.toString());
    if (!isRegistered) return res.status(403).json({ message: 'Not registered for this event' });
    const code = `${req.params.id}:${req.user._id}`;
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret').update(code).digest('hex').slice(0, 8);
    res.json({ code: `${code}:${signature}` });
  } catch (err) {
    next(err);
  }
};

export const getCertificate = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const userId = req.user._id.toString();
    const isRegistered = event.registeredUsers?.some((id) => id.toString() === userId);
    if (!isRegistered) return res.status(403).json({ message: 'Not registered for this event' });
    const user = await User.findById(userId).select('name').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([600, 400]);
    const w = page.getWidth();
    page.drawText('Certificate of Participation', { x: 120, y: 320, size: 24, font, color: rgb(0.2, 0.2, 0.4) });
    page.drawText(`This is to certify that ${user.name}`, { x: 80, y: 260, size: 14, font });
    page.drawText(`participated in "${event.title}"`, { x: 80, y: 235, size: 14, font });
    page.drawText(`on ${new Date(event.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}.`, { x: 80, y: 210, size: 14, font });
    page.drawText('SOTConnect - School of Technology', { x: 150, y: 120, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${event.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

export const getEventCategories = async (req, res, next) => {
  try {
    const { EVENT_CATEGORIES } = await import('../models/Event.js');
    res.json(EVENT_CATEGORIES);
  } catch (err) {
    next(err);
  }
};
