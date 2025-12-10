import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';

const app = express();

connectDB();

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
            payrollProcessing: 'Active'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log('='.repeat(50));
    console.log('   PayrollPro Backend Server Started');
    console.log('='.repeat(50));
    console.log(`🚀 Server: http://${HOST}:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

export default app;