import mongoose from 'mongoose';

const eventReminderSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remindAt: { type: Date, required: true },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventReminderSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model('EventReminder', eventReminderSchema);
