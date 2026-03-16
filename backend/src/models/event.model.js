const mongoose = require('mongoose');

const agendaItemSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ['In Person', 'Hybrid', 'Virtual'],
      default: 'In Person',
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    keynote: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    coverGradient: {
      type: String,
      default:
        'linear-gradient(135deg, #0f766e 0%, #134e4a 45%, #f59e0b 100%)',
    },
    agenda: {
      type: [agendaItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed'],
      default: 'published',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ startDate: 1, status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
