import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Typography, Spin, Row, Col, Breadcrumb } from 'antd';
import { HomeOutlined, TeamOutlined, UserAddOutlined, EditOutlined } from '@ant-design/icons';
import PageContainer from '@/components/layout/PageContainer';
import EmployeeForm from '@/components/domain/EmployeeForm';
import { useEmployee } from '@/hooks/useEmployees';
import { useCreateEmployee } from '@/hooks/useCreateEmployee';
import { useUpdateEmployee } from '@/hooks/useUpdateEmployee';

const { Title, Text } = Typography;

const EmployeeFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const { employee, loading: loadingEmployee } = useEmployee(id);
    const { create, loading: creating } = useCreateEmployee();
    const { update, loading: updating } = useUpdateEmployee();

    const defaultValues = useMemo(() => {
        if (!employee) return undefined;
        return {
            ...employee,
            personalInfo: {
                ...employee.personalInfo,
                dateOfBirth: employee?.personalInfo?.dateOfBirth?.split('T')?.[0],
            },
            employment: {
                ...employee.employment,
                dateOfJoining: employee?.employment?.dateOfJoining?.split('T')?.[0],
            },
        };
    }, [employee]);

    const handleSubmit = async (data) => {
        const payload = {
            ...data,
            salaryStructure: {
                ...data.salaryStructure,
                basicSalary: Number(data.salaryStructure.basicSalary),
                hra: Number(data.salaryStructure.hra || 0),
                da: Number(data.salaryStructure.da || 0),
                specialAllowance: Number(data.salaryStructure.specialAllowance || 0),
                otherAllowances: Number(data.salaryStructure.otherAllowances || 0),
            },
        };

        if (isEdit) {
            await update(id, payload);
        } else {
            await create(payload);
        }

        navigate('/admin/employees');
    };

    if (loadingEmployee && isEdit) {
        return (
            <PageContainer>
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" tip="Loading employee data..." />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb
                    items={[
                        { title: <><HomeOutlined /> Dashboard</>, href: '/admin/dashboard' },
                        { title: <><TeamOutlined /> Employees</>, href: '/admin/employees' },
                        { title: isEdit ? <><EditOutlined /> Edit Employee</> : <><UserAddOutlined /> Add Employee</> },
                    ]}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    {isEdit ? 'Edit Employee' : 'Add New Employee'}
                </Title>
                <Text type="secondary">
                    {isEdit ? 'Update employee information and salary structure' : 'Complete the onboarding details to add a new employee'}
                </Text>
            </div>

            <Card bordered={false} style={{ borderRadius: 8 }}>
                <EmployeeForm
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    loading={creating || updating}
                />
            </Card>
        </PageContainer>
    );
};

export default EmployeeFormPage;
