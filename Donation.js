const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  quantity: { type: String, required: true },
  photo: { type: String, required: true }, // URL to the photo
  pickupAddress: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Pending Pickup', 'Completed', 'Cancelled'],
    default: 'Available'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryMode: {
    type: String,
    enum: ['volunteer-collect', 'user-donate'],
    required: true
  }
}, { timestamps: true });

// Create a 2dsphere index for geospatial queries
donationSchema.index({ location: '2dsphere' });

const Donation = mongoose.model('Donation', donationSchema);
module.exports = Donation;