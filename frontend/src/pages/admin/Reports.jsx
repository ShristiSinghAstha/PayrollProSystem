import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Calendar, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { usePayrollStats } from '@/hooks/usePayroll';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { formatCurrency } from '@/utils/formatters';
import axios from '@/api/axios';
import { message } from 'antd';

const Reports = () => {
  const { stats: payrollStats, loading: payrollLoading } = usePayrollStats();
  const { stats: employeeStats, loading: employeeLoading } = useEmployeeStats();
  const [loadingExport, setLoadingExport] = useState(false);

  const loading = payrollLoading || employeeLoading;

  // Prepare data for charts
  const monthlyTrendData = (payrollStats?.byMonth || []).slice(0, 6).reverse().map(m => ({
    month: dayjs(m._id).format('MMM YY'),
    gross: m.totalGross,
    deductions: m.totalDeductions,
    net: m.totalNet,
    employees: m.totalEmployees
  }));

  const departmentData = (employeeStats?.byDepartment || []).map((dept, index) => ({
    name: dept._id,
    value: dept.count,
    color: ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'][index]
  }));

  // Salary distribution (mock data - you can enhance this)
  const salaryDistributionData = [
    { range: '< ₹30K', count: 12 },
    { range: '₹30-50K', count: 25 },
    { range: '₹50-75K', count: 18 },
    { range: '₹75-100K', count: 10 },
    { range: '> ₹100K', count: 5 }
  ];

  const handleExportPayroll = async () => {
    try {
      setLoadingExport(true);
      const response = await axios.get('/api/bulk/payroll/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Payroll report exported successfully');
    } catch (error) {
      message.error('Failed to export payroll report');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportEmployees = async () => {
    try {
      setLoadingExport(true);
      const response = await axios.get('/api/bulk/employees/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Employee report exported successfully');
    } catch (error) {
      message.error('Failed to export employee report');
    } finally {
      setLoadingExport(false);
    }
  };

  // Calculate totals
  const totalGross = monthlyTrendData.reduce((sum, item) => sum + item.gross, 0);
  const totalNet = monthlyTrendData.reduce((sum, item) => sum + item.net, 0);
  const totalDeductions = monthlyTrendData.reduce((sum, item) => sum + item.deductions, 0);
  const avgEmployees = Math.round(monthlyTrendData.reduce((sum, item) => sum + item.employees, 0) / monthlyTrendData.length);

  return (
    <PageContainer>
      {/* Header */}
      <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '32px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comprehensive insights into payroll and employee data
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportEmployees} disabled={loadingExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Employees
            </Button>
            <Button onClick={handleExportPayroll} disabled={loadingExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Payroll
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gross</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  ₹{(totalGross / 1000).toFixed(0)}K
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Last 6 months
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Net</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  ₹{(totalNet / 1000).toFixed(0)}K
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Last 6 months
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  ₹{(totalDeductions / 1000).toFixed(0)}K
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  All time total
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Employees</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{avgEmployees}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Per month
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Monthly Payroll Trend */}
        <Card className="border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Payroll Trend</CardTitle>
            <CardDescription>Gross, Net, and Deductions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="gross" stroke="#64748b" strokeWidth={2} name="Gross" />
                <Line type="monotone" dataKey="net" stroke="#94a3b8" strokeWidth={2} name="Net" />
                <Line type="monotone" dataKey="deductions" stroke="#cbd5e1" strokeWidth={2} name="Deductions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Department Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Salary Distribution */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Salary Distribution</CardTitle>
          <CardDescription>Number of employees by salary range</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Reports;