import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Card,
    Row,
    Col,
    Steps,
    Button,
    Divider,
    Statistic,
    Space,
    Typography,
    message
} from 'antd';
import {
    UserOutlined,
    BankOutlined,
    DollarOutlined,
    SafetyOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DEPARTMENTS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const schema = z.object({
    personalInfo: z.object({
        firstName: z.string().min(2, 'First name is required'),
        lastName: z.string().min(2, 'Last name is required'),
        email: z.string().email('Valid email required'),
        phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter 10-digit phone'),
        dateOfBirth: z.any(),
        address: z.object({
            street: z.string().optional().or(z.literal('')),
            city: z.string().optional().or(z.literal('')),
            state: z.string().optional().or(z.literal('')),
            zipCode: z.string().optional().or(z.literal('')),
            country: z.string().optional().or(z.literal('')),
        }).optional(),
    }),
    employment: z.object({
        department: z.string().min(1, 'Department required'),
        designation: z.string().min(2, 'Designation required'),
        dateOfJoining: z.any(),
        status: z.string().optional(),
    }),
    bankDetails: z.object({
        accountNumber: z.string().min(9, 'Account number required'),
        accountHolderName: z.string().min(2, 'Account holder required'),
        ifscCode: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Invalid IFSC'),
        bankName: z.string().min(2, 'Bank name required'),
        branch: z.string().optional().or(z.literal('')),
    }),
    salaryStructure: z.object({
        basicSalary: z.coerce.number().min(5000, 'Minimum ₹5000 required'),
        hra: z.coerce.number().min(0).optional(),
        da: z.coerce.number().min(0).optional(),
        specialAllowance: z.coerce.number().min(0).optional(),
        otherAllowances: z.coerce.number().min(0).optional(),
        pfPercentage: z.coerce.number().min(0),
        professionalTax: z.coerce.number().min(0),
        esiPercentage: z.coerce.number().min(0),
    }),
    password: z.string().optional(),
});

const defaultFormValues = {
    personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: null,
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
        },
    },
    employment: {
        department: DEPARTMENTS[0],
        designation: '',
        dateOfJoining: null,
        status: 'Active',
    },
    bankDetails: {
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        bankName: '',
        branch: '',
    },
    salaryStructure: {
        basicSalary: 0,
        hra: 0,
        da: 0,
        specialAllowance: 0,
        otherAllowances: 0,
        pfPercentage: 12,
        professionalTax: 200,
        esiPercentage: 0.75,
    },
    password: '',
};

const EmployeeForm = ({ defaultValues = defaultFormValues, onSubmit, loading }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const isEdit = Boolean(defaultValues?._id);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
        trigger,
    } = useForm({
        defaultValues,
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (defaultValues) {
            const formatted = {
                ...defaultValues,
                personalInfo: {
                    ...defaultValues.personalInfo,
                    dateOfBirth: defaultValues.personalInfo?.dateOfBirth ? dayjs(defaultValues.personalInfo.dateOfBirth) : null,
                },
                employment: {
                    ...defaultValues.employment,
                    dateOfJoining: defaultValues.employment?.dateOfJoining ? dayjs(defaultValues.employment.dateOfJoining) : null,
                },
            };
            reset(formatted);
        }
    }, [defaultValues, reset]);

    const watchSalary = watch('salaryStructure');

    const earnings = useMemo(() => {
        const { basicSalary = 0, hra = 0, da = 0, specialAllowance = 0, otherAllowances = 0 } = watchSalary || {};
        return Number(basicSalary) + Number(hra) + Number(da) + Number(specialAllowance) + Number(otherAllowances);
    }, [watchSalary]);

    const deductions = useMemo(() => {
        const { basicSalary = 0, pfPercentage = 0, professionalTax = 0, esiPercentage = 0 } = watchSalary || {};
        const pf = (Number(pfPercentage) / 100) * Number(basicSalary);
        const esi = (Number(esiPercentage) / 100) * Number(basicSalary);
        return pf + Number(professionalTax) + esi;
    }, [watchSalary]);

    const net = Math.max(earnings - deductions, 0);

    const steps = [
        {
            title: 'Personal Info',
            icon: <UserOutlined />,
            fields: ['personalInfo'],
        },
        {
            title: 'Employment',
            icon: <SafetyOutlined />,
            fields: ['employment'],
        },
        {
            title: 'Bank Details',
            icon: <BankOutlined />,
            fields: ['bankDetails'],
        },
        {
            title: 'Salary',
            icon: <DollarOutlined />,
            fields: ['salaryStructure', 'password'],
        },
    ];

    const handleNext = async () => {
        const fields = steps[currentStep].fields;
        const isValid = await trigger(fields);

        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        } else {
            message.error('Please fill all required fields correctly');
        }
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleFormSubmit = (data) => {
        const formatted = {
            ...data,
            personalInfo: {
                ...data.personalInfo,
                dateOfBirth: data.personalInfo.dateOfBirth ? dayjs(data.personalInfo.dateOfBirth).format('YYYY-MM-DD') : '',
            },
            employment: {
                ...data.employment,
                dateOfJoining: data.employment.dateOfJoining ? dayjs(data.employment.dateOfJoining).format('YYYY-MM-DD') : '',
            },
        };
        onSubmit(formatted);
    };

    return (
        <div>
            <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                {/* Step 0: Personal Information */}
                {currentStep === 0 && (
                    <Card title={<><UserOutlined /> Personal Information</>} bordered={false}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.firstName"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                First Name <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="Enter first name" status={errors.personalInfo?.firstName ? 'error' : ''} />
                                            {errors.personalInfo?.firstName && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.personalInfo.firstName.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.lastName"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Last Name <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="Enter last name" status={errors.personalInfo?.lastName ? 'error' : ''} />
                                            {errors.personalInfo?.lastName && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.personalInfo.lastName.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.email"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Email <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} type="email" size="large" placeholder="employee@company.com" status={errors.personalInfo?.email ? 'error' : ''} />
                                            {errors.personalInfo?.email && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.personalInfo.email.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.phone"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Phone <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="9876543210" maxLength={10} status={errors.personalInfo?.phone ? 'error' : ''} />
                                            {errors.personalInfo?.phone && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.personalInfo.phone.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.dateOfBirth"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Date of Birth <Text type="danger">*</Text>
                                            </label>
                                            <DatePicker {...field} size="large" style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="Select date" />
                                            {errors.personalInfo?.dateOfBirth && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.personalInfo.dateOfBirth.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>

                            <Col xs={24}>
                                <Divider orientation="left">Address (Optional)</Divider>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.address.street"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>Street</label>
                                            <Input {...field} size="large" placeholder="Street address" />
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="personalInfo.address.city"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>City</label>
                                            <Input {...field} size="large" placeholder="City" />
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <Controller
                                    name="personalInfo.address.state"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>State</label>
                                            <Input {...field} size="large" placeholder="State" />
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <Controller
                                    name="personalInfo.address.zipCode"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>PIN Code</label>
                                            <Input {...field} size="large" placeholder="110001" maxLength={6} />
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <Controller
                                    name="personalInfo.address.country"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>Country</label>
                                            <Input {...field} size="large" placeholder="India" />
                                        </div>
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* Step 1: Employment Details */}
                {currentStep === 1 && (
                    <Card title={<><SafetyOutlined /> Employment Details</>} bordered={false}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="employment.department"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Department <Text type="danger">*</Text>
                                            </label>
                                            <Select {...field} size="large" style={{ width: '100%' }} placeholder="Select department">
                                                {DEPARTMENTS.map((dept) => (
                                                    <Option key={dept} value={dept}>{dept}</Option>
                                                ))}
                                            </Select>
                                            {errors.employment?.department && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.employment.department.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="employment.designation"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Designation <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="e.g., Senior Developer" status={errors.employment?.designation ? 'error' : ''} />
                                            {errors.employment?.designation && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.employment.designation.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="employment.dateOfJoining"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Date of Joining <Text type="danger">*</Text>
                                            </label>
                                            <DatePicker {...field} size="large" style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="Select joining date" />
                                            {errors.employment?.dateOfJoining && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.employment.dateOfJoining.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="employment.status"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>Status</label>
                                            <Select {...field} size="large" style={{ width: '100%' }}>
                                                <Option value="Active">Active</Option>
                                                <Option value="Inactive">Inactive</Option>
                                                <Option value="Terminated">Terminated</Option>
                                                <Option value="Resigned">Resigned</Option>
                                            </Select>
                                        </div>
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* Step 2: Bank Details */}
                {currentStep === 2 && (
                    <Card title={<><BankOutlined /> Bank Details</>} bordered={false}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="bankDetails.accountNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Account Number <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="Enter account number" status={errors.bankDetails?.accountNumber ? 'error' : ''} />
                                            {errors.bankDetails?.accountNumber && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.bankDetails.accountNumber.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="bankDetails.accountHolderName"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Account Holder Name <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="As per bank records" status={errors.bankDetails?.accountHolderName ? 'error' : ''} />
                                            {errors.bankDetails?.accountHolderName && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.bankDetails.accountHolderName.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="bankDetails.ifscCode"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                IFSC Code <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="e.g., SBIN0001234" maxLength={11} status={errors.bankDetails?.ifscCode ? 'error' : ''} style={{ textTransform: 'uppercase' }} />
                                            {errors.bankDetails?.ifscCode && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.bankDetails.ifscCode.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="bankDetails.bankName"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>
                                                Bank Name <Text type="danger">*</Text>
                                            </label>
                                            <Input {...field} size="large" placeholder="e.g., State Bank of India" status={errors.bankDetails?.bankName ? 'error' : ''} />
                                            {errors.bankDetails?.bankName && (
                                                <Text type="danger" style={{ fontSize: 12 }}>{errors.bankDetails.bankName.message}</Text>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <Controller
                                    name="bankDetails.branch"
                                    control={control}
                                    render={({ field }) => (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: 8 }}>Branch (Optional)</label>
                                            <Input {...field} size="large" placeholder="Branch name" />
                                        </div>
                                    )}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* Step 3: Salary Structure */}
                {currentStep === 3 && (
                    <>
                        <Card title={<><DollarOutlined /> Salary Structure</>} bordered={false}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24}>
                                    <Title level={5}>Earnings</Title>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.basicSalary"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>
                                                    Basic Salary <Text type="danger">*</Text>
                                                </label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="50000" />
                                                {errors.salaryStructure?.basicSalary && (
                                                    <Text type="danger" style={{ fontSize: 12 }}>{errors.salaryStructure.basicSalary.message}</Text>
                                                )}
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.hra"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>HRA</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="15000" />
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.da"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>DA (Dearness Allowance)</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="5000" />
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.specialAllowance"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>Special Allowance</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="10000" />
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.otherAllowances"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>Other Allowances</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="0" />
                                            </div>
                                        )}
                                    />
                                </Col>

                                <Col xs={24}>
                                    <Divider />
                                    <Title level={5}>Deductions</Title>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.pfPercentage"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>PF (%)</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} max={100} suffix="%" placeholder="12" />
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.professionalTax"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>Professional Tax</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} prefix="₹" placeholder="200" />
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Controller
                                        name="salaryStructure.esiPercentage"
                                        control={control}
                                        render={({ field }) => (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: 8 }}>ESI (%)</label>
                                                <InputNumber {...field} size="large" style={{ width: '100%' }} min={0} max={100} suffix="%" placeholder="0.75" step={0.01} />
                                            </div>
                                        )}
                                    />
                                </Col>
                            </Row>

                            <Divider />

                            {/* Salary Summary */}
                            <Row gutter={16}>
                                <Col xs={24} sm={8}>
                                    <Card style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}>
                                        <Statistic
                                            title="Gross Earnings"
                                            value={earnings}
                                            precision={2}
                                            prefix="₹"
                                            valueStyle={{ color: '#1890ff', fontSize: 24 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Card style={{ background: '#fff1f0', border: '1px solid #ffccc7' }}>
                                        <Statistic
                                            title="Total Deductions"
                                            value={deductions}
                                            precision={2}
                                            prefix="₹"
                                            valueStyle={{ color: '#cf1322', fontSize: 24 }}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                        <Statistic
                                            title="Net Salary"
                                            value={net}
                                            precision={2}
                                            prefix="₹"
                                            valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 'bold' }}
                                        />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Per Month</Text>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>

                        {/* Portal Access */}
                        <Card title="Portal Access" style={{ marginTop: 16 }} bordered={false}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    {!isEdit ? (
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: 8 }}>
                                                        Temporary Password <Text type="danger">*</Text>
                                                    </label>
                                                    <Input.Password {...field} size="large" placeholder="Enter temporary password" />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Employee will use this to login for the first time
                                                    </Text>
                                                </div>
                                            )}
                                        />
                                    ) : (
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: 8 }}>
                                                        New Password (Optional)
                                                    </label>
                                                    <Input.Password {...field} size="large" placeholder="Leave empty to keep current password" />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Only fill this if you want to reset the password
                                                    </Text>
                                                </div>
                                            )}
                                        />
                                    )}
                                </Col>
                            </Row>
                        </Card>
                    </>
                )}

                {/* Navigation Buttons */}
                <Card style={{ marginTop: 24 }} bordered={false}>
                    <Row justify="space-between">
                        <Col>
                            {currentStep > 0 && (
                                <Button size="large" icon={<ArrowLeftOutlined />} onClick={handlePrevious}>
                                    Previous
                                </Button>
                            )}
                        </Col>
                        <Col>
                            <Space>
                                {currentStep < steps.length - 1 ? (
                                    <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNext} iconPosition="end">
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
                                        {loading ? 'Saving...' : (isEdit ? 'Update Employee' : 'Create Employee')}
                                    </Button>
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Card>
            </form>
        </div>
    );
};

export default EmployeeForm;
