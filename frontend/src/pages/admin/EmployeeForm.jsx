import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';
import EmployeeForm from '@/components/domain/EmployeeForm';
import { useEmployee } from '@/hooks/useEmployees';
import { useCreateEmployee } from '@/hooks/useCreateEmployee';
import { useUpdateEmployee } from '@/hooks/useUpdateEmployee';

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
                dateOfJoining: employee?.employment?.dateOfJoining?.split('T')?.[0],  // ✅ ADD THIS
            },
        };
    }, [employee]);

    const handleSubmit = async (data) => {
        const payload = {
            ...data,
            salaryStructure: {
                ...data.salaryStructure,
                basicSalary: Number(data.salaryStructure.basicSalary),
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
            <div className="py-10 flex justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? 'Edit Employee' : 'Add New Employee'}
                    </h1>
                    <p className="text-gray-600">Complete the onboarding details</p>
                </div>
            </div>

            <Card>
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
