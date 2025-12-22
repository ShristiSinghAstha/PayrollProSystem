import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, Edit2, ChevronRight, Mail, Phone, MapPin, Briefcase, Calendar, Building, CreditCard, DollarSign } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployee } from '@/hooks/useEmployees';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '@/utils/formatters';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { employee, loading } = useEmployee(id);

    if (loading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center py-24">
                    <LoadingSpinner />
                    <p className="ml-3 text-muted-foreground">Loading employee details...</p>
                </div>
            </PageContainer>
        );
    }

    if (!employee) {
        return (
            <PageContainer>
                <div className="text-center py-12">
                    <p className="text-gray-600">Employee not found</p>
                    <Button className="mt-4" onClick={() => navigate('/admin/employees')}>
                        Back to Employees
                    </Button>
                </div>
            </PageContainer>
        );
    }

    const salaryStructure = employee.salaryStructure || {};
    const grossSalary = (salaryStructure.basicSalary || 0) +
        (salaryStructure.hra || 0) +
        (salaryStructure.da || 0) +
        (salaryStructure.specialAllowance || 0) +
        (salaryStructure.otherAllowances || 0);

    const deductions = (salaryStructure.basicSalary || 0) * (salaryStructure.pfPercentage || 0) / 100 +
        (salaryStructure.professionalTax || 0) +
        grossSalary * (salaryStructure.esiPercentage || 0) / 100;

    const netSalary = grossSalary - deductions;

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
                <span className="text-foreground">Employee Details</span>
            </div>

            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-700 text-white rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold">
                                {employee.personalInfo?.firstName?.[0]}
                                {employee.personalInfo?.lastName?.[0]}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {employee.employeeId} • {employee.employment?.designation} • {employee.employment?.department}
                            </p>
                        </div>
                    </div>
                    <Button size="lg" className="gap-2" onClick={() => navigate(`/admin/employees/${id}/edit`)}>
                        <Edit2 className="h-4 w-4" />
                        Edit Employee
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Personal Information */}
                <Card className="border">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.personalInfo?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Phone</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.personalInfo?.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {employee.personalInfo?.dateOfBirth ? formatDate(employee.personalInfo.dateOfBirth) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Address</p>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {employee.personalInfo?.address?.street && (
                                            <>
                                                {employee.personalInfo.address.street}<br />
                                                {employee.personalInfo.address.city && `${employee.personalInfo.address.city}, `}
                                                {employee.personalInfo.address.state && `${employee.personalInfo.address.state} `}
                                                {employee.personalInfo.address.zipCode && employee.personalInfo.address.zipCode}<br />
                                                {employee.personalInfo.address.country}
                                            </>
                                        )}
                                        {!employee.personalInfo?.address?.street && 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Information */}
                <Card className="border">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg">Employment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Department</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.employment?.department}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Designation</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.employment?.designation}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date of Joining</p>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {employee.employment?.dateOfJoining ? formatDate(employee.employment.dateOfJoining) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 flex items-center justify-center mt-0.5">
                                    <div className={`h-3 w-3 rounded-full ${employee.employment?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.employment?.status || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card className="border">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg">Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Account Number</p>
                                    <p className="mt-1 text-sm text-gray-900 font-mono">{employee.bankDetails?.accountNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Bank Name</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.bankDetails?.bankName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">IFSC Code</p>
                                    <p className="mt-1 text-sm text-gray-900 font-mono">{employee.bankDetails?.ifscCode}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Branch</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.bankDetails?.branch || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 md:col-span-2">
                                <div className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Account Holder Name</p>
                                    <p className="mt-1 text-sm text-gray-900">{employee.bankDetails?.accountHolderName}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Salary Structure */}
                <Card className="border">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg">Salary Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Earnings */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Earnings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Basic Salary</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.basicSalary || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">HRA</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.hra || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">DA</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.da || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Special Allowance</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.specialAllowance || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Other Allowances</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.otherAllowances || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Deductions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">PF ({salaryStructure.pfPercentage || 0}%)</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency((salaryStructure.basicSalary || 0) * (salaryStructure.pfPercentage || 0) / 100)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Professional Tax</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(salaryStructure.professionalTax || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">ESI ({salaryStructure.esiPercentage || 0}%)</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(grossSalary * (salaryStructure.esiPercentage || 0) / 100)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="border-t pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs font-medium text-blue-700 uppercase">Gross Salary</p>
                                        <p className="mt-2 text-2xl font-semibold text-blue-900">{formatCurrency(grossSalary)}</p>
                                    </div>
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-xs font-medium text-red-700 uppercase">Total Deductions</p>
                                        <p className="mt-2 text-2xl font-semibold text-red-900">{formatCurrency(deductions)}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs font-medium text-green-700 uppercase">Net Salary</p>
                                        <p className="mt-2 text-2xl font-semibold text-green-900">{formatCurrency(netSalary)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default EmployeeDetail;
