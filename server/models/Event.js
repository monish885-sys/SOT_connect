import mongoose from 'mongoose';

const CATEGORIES = ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Other'];
const RECURRENCE_RULES = ['none', 'daily', 'weekly', 'monthly'];

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    venue: { type: String, required: true, trim: true },
    venueMapUrl: { type: String, trim: true },
    date: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    tags: [{ type: String, trim: true }],
    coverImageUrl: { type: String, trim: true },
    attachments: [attachmentSchema],
    registrationStart: { type: Date },
    registrationEnd: { type: Date },
    unregisterDeadlineHours: { type: Number, min: 0 },
    isDraft: { type: Boolean, default: true },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    registeredCount: { type: Number, default: 0 },
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    recurrenceRule: { type: String, enum: RECURRENCE_RULES, default: 'none' },
    parentEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ isDraft: 1 });
eventSchema.index({ title: 'text', description: 'text', venue: 'text', tags: 'text' });

eventSchema.pre('save', function (next) {
  this.registeredCount = this.registeredUsers?.length ?? 0;
  next();
});

export const EVENT_CATEGORIES = CATEGORIES;
export default mongoose.model('Event', eventSchema);
