const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  mobile: String,
  altMobile: String,
  dateOfBirth: String,
  guardianName: String,
  guardianMobile: String,
  guardianEmail: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  profilePhoto: {
    type: String,
    default: ""
  },
  youtube: String,
  facebook: String,
  instagram: String,
  isProfessional: String,
  experience: String,
  skills: [
    {
      style: String,
      level: String
    }
  ],
  status: {
    type: String,
    default: 'Active'
  },
  enrolled_batches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    }
  ],
  isOwner: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
