import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attendanceSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
