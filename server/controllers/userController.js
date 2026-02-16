import User from '../models/User.js';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';

export const getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'studentId', 'department', 'phone'];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    const events = await Event.find({ registeredUsers: req.user._id })
      .sort({ date: 1 })
      .select('title description venue date capacity registeredCount category tags unregisterDeadlineHours')
      .lean();
    const eventIds = events.map((e) => e._id);
    const attendances = await Attendance.find({ event: { $in: eventIds }, user: req.user._id }).lean();
    const checkedInSet = new Set(attendances.map((a) => a.event.toString()));
    const withStatus = events.map((e) => ({
      ...e,
      checkedIn: checkedInSet.has(e._id.toString()),
    }));
    res.json(withStatus);
  } catch (err) {
    next(err);
  }
};
