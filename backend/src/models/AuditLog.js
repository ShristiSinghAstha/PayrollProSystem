import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: [true, 'Action is required'],
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
      'PROCESS', 'PAY', 'LOGIN', 'LOGOUT', 'EXPORT', 'DOWNLOAD'
    ],
    uppercase: true,
    index: true
  },
  
  entity: { 
    type: String, 
    required: [true, 'Entity is required'],
    enum: ['Employee', 'Payroll', 'User', 'System'],
    trim: true,
    index: true
  },
  
  entityId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    userRole: {
      type: String,
      enum: ['admin', 'employee', 'system'],
      required: true
    }
  },
  
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  metadata: {
    ipAddress: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v) || 
                 /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
        },
        message: 'Invalid IP address format'
      }
    },
    userAgent: {
      type: String,
      trim: true
    },
    requestMethod: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      uppercase: true
    },
    requestUrl: {
      type: String,
      trim: true
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    uppercase: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS',
    uppercase: true,
    index: true
  },
  
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now,
    required: true,
    index: true
  }
  
}, { 
  timestamps: false,
  versionKey: false
});

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ 'performedBy.userId': 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, status: 1 });
auditLogSchema.index({ entity: 1, action: 1, timestamp: -1 });

auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

auditLogSchema.virtual('changeSummary').get(function() {
  if (!this.changes.before && !this.changes.after) {
    return 'No changes recorded';
  }
  
  if (!this.changes.before && this.changes.after) {
    return 'New record created';
  }
  
  if (this.changes.before && !this.changes.after) {
    return 'Record deleted';
  }
  
  const before = this.changes.before || {};
  const after = this.changes.after || {};
  const changedFields = Object.keys(after).filter(key => 
    JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );
  
  return `${changedFields.length} field(s) modified`;
});

auditLogSchema.pre('save', function(next) {
  if (!this.severity || this.severity === 'LOW') {
    const criticalActions = ['DELETE', 'APPROVE', 'PAY'];
    const highActions = ['UPDATE', 'PROCESS'];
    
    if (criticalActions.includes(this.action)) {
      this.severity = 'CRITICAL';
    } else if (highActions.includes(this.action)) {
      this.severity = 'HIGH';
    } else {
      this.severity = 'MEDIUM';
    }
  }
});

auditLogSchema.methods.getDetailedChanges = function() {
  const before = this.changes.before || {};
  const after = this.changes.after || {};
  const changes = [];
  
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  allKeys.forEach(key => {
    const oldValue = before[key];
    const newValue = after[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue: oldValue === undefined ? 'N/A' : oldValue,
        newValue: newValue === undefined ? 'N/A' : newValue
      });
    }
  });
  
  return changes;
};

auditLogSchema.statics.getEntityHistory = function(entity, entityId, limit = 50) {
  return this.find({ entity, entityId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getUserActivity = function(userId, startDate, endDate) {
  const query = { 'performedBy.userId': userId };
  
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .lean();
};

auditLogSchema.statics.getRecentCritical = function(limit = 20) {
  return this.find({ severity: 'CRITICAL' })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

auditLogSchema.statics.getActivitySummary = async function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return summary;
};

auditLogSchema.statics.searchLogs = function(filters = {}) {
  const query = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.entity) query.entity = filters.entity;
  if (filters.userId) query['performedBy.userId'] = filters.userId;
  if (filters.severity) query.severity = filters.severity;
  if (filters.status) query.status = filters.status;
  
  if (filters.startDate && filters.endDate) {
    query.timestamp = { 
      $gte: filters.startDate, 
      $lte: filters.endDate 
    };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100)
    .lean();
};

export default mongoose.model('AuditLog', auditLogSchema);