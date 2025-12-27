import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import payslipRoutes from './routes/payslipRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import bulkRoutes from './routes/bulkRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const app = express();
const httpServer = createServer(app);

connectDB();

// Initialize Socket.io
initSocket(httpServer);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'PayrollPro API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        modules: {
            authentication: 'Active',
            employeeManagement: 'Active',
            payrollProcessing: 'Active',
            payslipGeneration: 'Active',
            notifications: 'Active',
            leaveManagement: 'Active',
            attendanceTracking: 'Active',
            realTimeUpdates: 'Active'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

httpServer.listen(PORT, HOST, () => {
    console.log('='.repeat(50));
    console.log('   PayrollPro Backend Server Started');
    console.log('='.repeat(50));
    console.log(`🚀 Server: http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.io: Ready`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
});

// Global error handlers - don't crash on promise rejections during processing
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', {
        reason: reason,
        message: reason?.message,
        stack: reason?.stack,
        promise: promise
    });
    // Don't crash - log and continue (important for bulk operations)
    // The individual try-catch blocks will handle rollback
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', {
        message: err.message,
        stack: err.stack,
        code: err.code
    });
    // For uncaught exceptions, we should exit gracefully
    console.error('Server will shut down due to uncaught exception...');
    process.exit(1);
});

export default app;