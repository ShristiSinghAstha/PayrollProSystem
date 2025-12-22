import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Edit2, RefreshCw, Upload, Download, Users, Building2 } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DEPARTMENTS } from '@/utils/constants';
import { message } from 'antd';
import { cn } from '@/lib/utils';
import axios from '@/api/axios';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const { employees, loading, refetch } = useEmployees({ ...filters, page: pagination.current, limit: pagination.pageSize });

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-50 text-green-700 border-green-200',
      'Inactive': 'bg-gray-50 text-gray-700 border-gray-200',
      'Terminated': 'bg-red-50 text-red-700 border-red-200',
      'Resigned': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const calculateGrossSalary = (salaryStructure) => {
    return (salaryStructure.basicSalary || 0) +
      (salaryStructure.hra || 0) +
      (salaryStructure.da || 0) +
      (salaryStructure.specialAllowance || 0) +
      (salaryStructure.otherAllowances || 0);
  };

  const handleExportEmployees = async () => {
    try {
      const response = await axios.get('/api/bulk/employees/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Employees exported successfully');
    } catch (error) {
      message.error('Failed to export employees');
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Employees</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your organization's workforce</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportEmployees} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => navigate('/admin/employees/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Department</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={refetch}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Employees</CardTitle>
          <CardDescription>Total {employees?.length || 0} employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Employee ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Gross Salary</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((employee) => (
                  <tr key={employee._id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-primary">{employee.employeeId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {employee.personalInfo.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{employee.employment.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{employee.employment.position}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                        getStatusColor(employee.employment.status)
                      )}>
                        {employee.employment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {formatCurrency(calculateGrossSalary(employee.salaryStructure))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/employees/${employee._id}/view`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/employees/${employee._id}/edit`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {employees?.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No employees found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first employee</p>
                <Button className="mt-6 gap-2" onClick={() => navigate('/admin/employees/new')}>
                  <Plus className="h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default EmployeeList;
