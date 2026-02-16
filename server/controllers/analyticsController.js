import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalEvents, upcomingEvents, totalRegistrations, eventsThisMonth, attendances] = await Promise.all([
      Event.countDocuments({}),
      Event.countDocuments({ date: { $gte: now }, isDraft: false }),
      Event.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$registeredCount', 0] } } } },
      ]).then((r) => (r[0]?.total ?? 0)),
      Event.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Attendance.countDocuments({}),
    ]);

    const topEvents = await Event.find({ isDraft: false })
      .sort({ registeredCount: -1, date: 1 })
      .limit(5)
      .select('title date registeredCount capacity')
      .lean();

    const byCategory = await Event.aggregate([
      { $match: { isDraft: false } },
      { $group: { _id: { $ifNull: ['$category', 'Other'] }, count: { $sum: 1 }, registrations: { $sum: { $ifNull: ['$registeredCount', 0] } } } },
    ]);

    const eventsPerMonth = await Event.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      eventsThisMonth,
      totalCheckIns: attendances,
      topEvents,
      byCategory,
      eventsPerMonth,
    });
  } catch (err) {
    next(err);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .select('title date venue category registeredCount capacity isDraft')
      .lean();

    const headers = ['Title', 'Date', 'Venue', 'Category', 'Registered', 'Capacity', 'Created By'];
    const rows = events.map((e) => [
      e.title,
      new Date(e.date).toISOString(),
      e.venue,
      e.category || '',
      e.registeredCount ?? e.registeredUsers?.length ?? 0,
      e.capacity,
      e.createdBy?.name || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events_report.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
