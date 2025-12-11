import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DEPARTMENTS } from '@/utils/constants';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const { employees, loading, refetch } = useEmployees(filters);

  const columns = [
    { header: 'ID', key: 'employeeId' },
    {
      header: 'Name',
      key: 'fullName',
      render: (_, row) => `${row.personalInfo.firstName} ${row.personalInfo.lastName}`,
    },
    {
      header: 'Department',
      key: 'department',
      render: (_, row) => row.employment.department,
    },
    {
      header: 'Designation',
      key: 'designation',
      render: (_, row) => row.employment.designation,
    },
    {
      header: 'Net / Month',
      key: 'salary',
      render: (_, row) => formatCurrency(row.salaryStructure.basicSalary + row.salaryStructure.hra + row.salaryStructure.da + row.salaryStructure.specialAllowance + row.salaryStructure.otherAllowances),
    },
    {
      header: 'Status',
      key: 'status',
      render: (_, row) => row.employment.status,
    },
    {
      header: 'Joined',
      key: 'dateOfJoining',
      render: (_, row) => formatDate(row.employment.dateOfJoining),
    },
  ];

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee records</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/employees/new')}>
          + Add Employee
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="w-full md:w-40">
            <Select
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
              options={[{ label: 'All Depts', value: '' }, ...DEPARTMENTS.map((d) => ({ label: d, value: d }))]}
            />
          </div>
          <div className="w-full md:w-36">
            <Select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
                { label: 'Terminated', value: 'Terminated' },
                { label: 'Resigned', value: 'Resigned' },
              ]}
            />
          </div>
          <Button variant="secondary" onClick={refetch}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState title="No employees" description="Add your first employee to get started" />
        ) : (
          <Table
            columns={columns}
            data={employees}
            onRowClick={(row) => navigate(`/admin/employees/${row._id}`)}
          />
        )}
      </Card>
    </PageContainer>
  );
};

export default EmployeeList;
