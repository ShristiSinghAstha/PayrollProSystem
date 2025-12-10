import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Import routes
import employeeRoutes from './routes/employeeRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'PayrollPro API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        modules: {
            employeeManagement: 'Active',
            payrollProcessing: 'Active'
        }
    });
});

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);

// 404 Handler (must be after all routes)
app.use('*', notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

// Server Configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start Server
app.listen(PORT, HOST, () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     PayrollPro Backend Server Started     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`🚀 Server: http://${HOST}:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('════════════════════════════════════════════');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

export default app;