const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset'],
    default: 'registration'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-expires after 10 minutes (TTL index)
  }
});

otpSchema.index({ email: 1, purpose: 1 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
