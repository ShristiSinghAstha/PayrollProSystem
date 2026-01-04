import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Clock, DollarSign, Plus, TrendingUp, PieChart, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { usePayrollStats } from '@/hooks/usePayroll';
import { useLeaveStats } from '@/hooks/useLeaveStats';
import { useEmployeeGrowth } from '@/hooks/useEmployeeGrowth';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const AdminDashboard = () => {
  const { stats: employeeStats } = useEmployeeStats();
  const { stats: payrollStats } = usePayrollStats({ month: undefined });
  const { stats: leaveStats } = useLeaveStats();
  const { data: employeeGrowth } = useEmployeeGrowth(6);

  // Monthly trend data
  const monthlyPayrollData = payrollStats?.byMonth?.slice(0, 6).reverse().map(month => ({
    month: month._id,
    amount: month.totalNet,
  })) || [];

  // Department distribution data
  const departmentData = employeeStats?.byDepartment?.map(dept => ({
    name: dept._id,
    value: dept.count,
    color: ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'][employeeStats.byDepartment.indexOf(dept)]
  })) || [];

  // Recent activities
  const recentActivities = [
    { id: 1, action: "Payroll processed for December 2025", time: "2 hours ago" },
    { id: 2, action: "New employee added: Sarah Johnson", time: "5 hours ago" },
    { id: 3, action: "15 payroll records approved", time: "1 day ago" },
    { id: 4, action: "Department budget updated", time: "2 days ago" },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b bg-card mb-8"
        style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Overview of workforce and payroll</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/employees/new">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </Link>
            <Link to="/admin/payroll">
              <Button className="gap-2">
                <DollarSign className="h-4 w-4" />
                Process Payroll
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Summary */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={cardVariants}>
          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={employeeStats?.total || 0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={employeeStats?.active || 0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <UserCheck className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payrolls</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={payrollStats?.pending || 0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Month Net</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    ₹<CountUp end={payrollStats?.currentMonthNet || 0} duration={2.5} separator="," />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content - Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Monthly Payroll Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Payroll Trend</CardTitle>
              <CardDescription>Net payout over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPayrollData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
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
                  <Bar dataKey="amount" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approvals Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payroll Approvals */}
                <Link to="/admin/payroll" className="block group">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-yellow-50 p-2.5">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Payroll Approvals</p>
                        <p className="text-xs text-muted-foreground">Pending review</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-semibold text-foreground">
                        <CountUp end={payrollStats?.pending || 0} duration={2} />
                      </span>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Review
                      </Button>
                    </div>
                  </div>
                </Link>

                {/* Leave Requests */}
                <Link to="/admin/leaves" className="block group">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-50 p-2.5">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Leave Requests</p>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-semibold text-foreground">
                        <CountUp end={leaveStats?.byStatus?.Pending?.count || 0} duration={2} />
                      </span>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Review
                      </Button>
                    </div>
                  </div>
                </Link>

                {/* Quick Stats */}
                <div className="pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Active Employees</p>
                      <p className="text-lg font-semibold text-foreground">
                        <CountUp end={employeeStats?.active || 0} duration={2} />
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Departments</p>
                      <p className="text-lg font-semibold text-foreground">
                        <CountUp end={employeeStats?.byDepartment?.length || 0} duration={2} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payroll Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Payroll Status Overview</CardTitle>
            <CardDescription>Current month payroll processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-yellow-50 p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    <CountUp end={payrollStats?.pending || 0} duration={2} />
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-blue-50 p-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    <CountUp end={payrollStats?.approved || 0} duration={2} />
                  </p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-green-50 p-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    <CountUp end={payrollStats?.paid || 0} duration={2} />
                  </p>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-red-50 p-2">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    <CountUp end={payrollStats?.failed || 0} duration={2} />
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Employee Growth Chart - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mb-8"
      >
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Growth Trend</CardTitle>
            <CardDescription>New employee hires over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={employeeGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/employees/new">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 w-full">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Add Employee</span>
                  </Button>
                </Link>
                <Link to="/admin/payroll">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 w-full">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-xs">Process Payroll</span>
                  </Button>
                </Link>
                <Link to="/admin/leaves">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 w-full">
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Leave Approvals</span>
                  </Button>
                </Link>
                <Link to="/admin/reports">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 w-full">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer >
  );
};

export default AdminDashboard;