import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ['PAYSLIP_READY', 'PAYMENT_SUCCESS', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SYSTEM_ALERT'],
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  link: {
    type: String,
    trim: true
  },

  read: {
    type: Boolean,
    default: false,
    index: true
  },

  readAt: {
    type: Date
  }

}, {
  timestamps: true
});

notificationSchema.index({ employeeId: 1, createdAt: -1 });
notificationSchema.index({ employeeId: 1, read: 1 });

notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
};

notificationSchema.statics.getUnreadCount = function (employeeId) {
  return this.countDocuments({ employeeId, read: false });
};

notificationSchema.statics.getEmployeeNotifications = function (employeeId, limit = 20) {
  return this.find({ employeeId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export default mongoose.model('Notification', notificationSchema);