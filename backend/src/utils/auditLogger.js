import AuditLog from '../models/AuditLog.js';

const logAction = async (action, entity, entityId, performedBy = {}, changes = {}, metadata = {}) => {
  try {
    if (!action || !entity || !entityId) {
      console.error('Audit log failed: Missing required fields');
      return null;
    }

    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PROCESS', 'PAY'];
    if (!validActions.includes(action)) {
      console.error(`Invalid action type: ${action}`);
      return null;
    }

    const validEntities = ['Employee', 'Payroll', 'User', 'System'];
    if (!validEntities.includes(entity)) {
      console.error(`Invalid entity type: ${entity}`);
      return null;
    }

    const auditEntry = await AuditLog.create({
      action,
      entity,
      entityId,
      performedBy: {
        userId: performedBy.userId || null,
        userName: performedBy.userName || 'SYSTEM',
        userRole: performedBy.userRole || 'admin'
      },
      changes: {
        before: changes.before || null,
        after: changes.after || null
      },
      metadata: {
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        requestMethod: metadata.requestMethod || null,
        requestUrl: metadata.requestUrl || null
      },
      timestamp: new Date()
    });

    console.log(`✅ Audit: ${action} on ${entity}`);
    return auditEntry;

  } catch (error) {
    console.error('Audit logging error:', error.message);
    return null;
  }
};

const sanitizeEmployeeData = (employee) => {
  if (!employee) return null;

  return {
    employeeId: employee.employeeId,
    name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`,
    email: employee.personalInfo?.email,
    department: employee.employment?.department,
    designation: employee.employment?.designation,
    status: employee.employment?.status
  };
};

export const logEmployeeCreation = async (employee, performedBy = {}, metadata = {}) => {
  return await logAction(
    'CREATE',
    'Employee',
    employee._id,
    performedBy,
    { after: sanitizeEmployeeData(employee) },
    metadata
  );
};

export const logEmployeeUpdate = async (oldEmployee, newEmployee, performedBy = {}, metadata = {}) => {
  return await logAction(
    'UPDATE',
    'Employee',
    newEmployee._id,
    performedBy,
    {
      before: sanitizeEmployeeData(oldEmployee),
      after: sanitizeEmployeeData(newEmployee)
    },
    metadata
  );
};

export const logEmployeeDelete = async (employee, performedBy = {}, metadata = {}) => {
  return await logAction(
    'DELETE',
    'Employee',
    employee._id,
    performedBy,
    { before: sanitizeEmployeeData(employee) },
    metadata
  );
};

export const logPayrollProcess = async (payrollId, performedBy = {}, metadata = {}) => {
  return await logAction(
    'PROCESS',
    'Payroll',
    payrollId,
    performedBy,
    {},
    metadata
  );
};

export const logPayrollApproval = async (payroll, performedBy = {}, metadata = {}) => {
  return await logAction(
    'APPROVE',
    'Payroll',
    payroll._id,
    performedBy,
    { 
      after: { 
        status: payroll.status, 
        approvedAt: payroll.approvedAt,
        netSalary: payroll.netSalary
      } 
    },
    metadata
  );
};

export const getAuditLogs = async (filters = {}, limit = 100) => {
  try {
    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.entity) query.entity = filters.entity;
    if (filters.performedBy) query['performedBy.userId'] = filters.performedBy;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    return logs;

  } catch (error) {
    console.error('Error fetching audit logs:', error.message);
    throw error;
  }
};