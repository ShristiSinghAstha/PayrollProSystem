import { useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import PageContainer from '@/components/layout/PageContainer';
import EmployeeForm from '@/components/domain/EmployeeForm';
import { useEmployee } from '@/hooks/useEmployees';
import { useCreateEmployee } from '@/hooks/useCreateEmployee';
import { useUpdateEmployee } from '@/hooks/useUpdateEmployee';
import { Home, Users, UserPlus, Edit2, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import dayjs from 'dayjs';

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
                dateOfBirth: employee?.personalInfo?.dateOfBirth ? dayjs(employee.personalInfo.dateOfBirth) : null,
            },
            employment: {
                ...employee.employment,
                dateOfJoining: employee?.employment?.dateOfJoining ? dayjs(employee.employment.dateOfJoining) : null,
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
                <div className="flex items-center justify-center py-24">
                    <LoadingSpinner />
                    <p className="ml-3 text-muted-foreground">Loading employee data...</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link to="/admin/employees" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Users className="h-4 w-4" />
                    <span>Employees</span>
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="flex items-center gap-1 text-foreground">
                    {isEdit ? <Edit2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    <span>{isEdit ? 'Edit Employee' : 'Add Employee'}</span>
                </span>
            </div>

            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    {isEdit ? 'Edit Employee' : 'Add New Employee'}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {isEdit ? 'Update employee information and salary structure' : 'Complete the onboarding details to add a new employee'}
                </p>
            </div>

            {/* Form Card */}
            <Card className="border">
                <CardContent className="pt-6">
                    <EmployeeForm
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        loading={creating || updating}
                    />
                </CardContent>
            </Card>
        </PageContainer>
    );
};

export default EmployeeFormPage;
