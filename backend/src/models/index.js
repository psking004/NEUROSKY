import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);

const alertSchema = new mongoose.Schema({
  severity: { type: String, enum: ['warning', 'critical'], required: true },
  distance: Number,
  droneIds: [String],
  timestamp: { type: Date, default: Date.now },
});

export const Alert = mongoose.model('Alert', alertSchema);

const flightLogSchema = new mongoose.Schema({
  droneId: String,
  coordinates: {
    lat: Number,
    lon: Number,
  },
  altitude: Number,
  speed: Number,
  timestamp: { type: Date, default: Date.now, index: { expires: '24h' } },
});

export const FlightLog = mongoose.model('FlightLog', flightLogSchema);
