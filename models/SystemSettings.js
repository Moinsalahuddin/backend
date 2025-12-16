const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Room Rates Configuration
  roomRates: {
    Single: { type: Number, default: 100 },
    Double: { type: Number, default: 150 },
    Suite: { type: Number, default: 250 },
    Deluxe: { type: Number, default: 350 },
    Presidential: { type: Number, default: 500 }
  },
  
  // Tax Configuration
  taxSettings: {
    serviceTax: { type: Number, default: 10 }, // Percentage
    gst: { type: Number, default: 5 }, // Percentage
    cityTax: { type: Number, default: 2 } // Percentage
  },
  
  // Hotel Policies
  policies: {
    cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    petPolicy: { type: String, default: 'Pets not allowed' },
    smokingPolicy: { type: String, default: 'Non-smoking property' }
  },
  
  // Hotel Information
  hotelInfo: {
    name: { type: String, default: 'LuxuryStay Hospitality' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  
  // Email Settings
  emailSettings: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' },
    fromEmail: { type: String, default: '' },
    fromName: { type: String, default: 'LuxuryStay Hospitality' }
  },
  
  // ⚠️ Note: For quick testing, you can uncomment and fill default values below:
  // emailSettings: {
  //   smtpHost: { type: String, default: 'smtp.gmail.com' },
  //   smtpPort: { type: Number, default: 587 },
  //   smtpUser: { type: String, default: 'your-email@gmail.com' },
  //   smtpPassword: { type: String, default: 'your-app-password' },
  //   fromEmail: { type: String, default: 'your-email@gmail.com' },
  //   fromName: { type: String, default: 'LuxuryStay Team' }
  // },
  
  // Notification Settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    notifyOnBooking: { type: Boolean, default: true },
    notifyOnCheckIn: { type: Boolean, default: true },
    notifyOnCheckOut: { type: Boolean, default: true },
    notifyOnMaintenance: { type: Boolean, default: true }
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

