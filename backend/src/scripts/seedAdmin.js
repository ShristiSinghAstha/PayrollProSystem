import 'dotenv/config';
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';

const seedAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const existingAdmin = await Employee.findOne({ role: 'admin' });
``
        if (existingAdmin) {
            console.log('⚠️  Admin already exists:');
            console.log(`   Email: ${existingAdmin.personalInfo.email}`);
            console.log(`   Employee ID: ${existingAdmin.employeeId}`);
            process.exit(0);
        }

        const year = new Date().getFullYear();
        const employeeId = `HR-${year}-1001`;

        const admin = await Employee.create({
            employeeId,
            personalInfo: {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@payrollpro.com',
                phone: '9876543210',
                dateOfBirth: new Date('1990-01-01'),
                address: {
                    street: 'Admin Street',
                    city: 'Lucknow',
                    state: 'Uttar Pradesh',
                    zipCode: '226001',
                    country: 'India'
                }
            },
            employment: {
                department: 'HR',
                designation: 'System Administrator',
                dateOfJoining: new Date(),
                status: 'Active'
            },
            bankDetails: {
                accountNumber: '1234567890123456',
                accountHolderName: 'ADMIN USER',
                ifscCode: 'SBIN0000001',
                bankName: 'State Bank of India',
                branch: 'Lucknow Main'
            },
            salaryStructure: {
                basicSalary: 50000,
                hra: 15000,
                da: 5000,
                specialAllowance: 10000,
                otherAllowances: 5000
            },
            password: 'admin123',
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!');
        console.log('='.repeat(50));
        console.log('📧 Email: admin@payrollpro.com');
        console.log('🔑 Password: admin123');
        console.log(`👤 Employee ID: ${admin.employeeId}`);
        console.log('='.repeat(50));
        console.log('⚠️  Please change the password after first login');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();