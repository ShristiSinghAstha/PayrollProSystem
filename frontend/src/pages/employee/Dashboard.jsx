import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, DollarSign, Bell, Plus, Eye, TrendingUp, Clock, Award, AlertCircle } from "lucide-react";
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const EmployeeDashboard = () => {
  const { data, loading } = useEmployeeDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Apply Leave', icon: Plus, action: () => navigate('/employee/leaves'), color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'View Payslips', icon: FileText, action: () => navigate('/employee/payslips'), color: 'bg-green-600 hover:bg-green-700' },
    { label: 'My Profile', icon: Eye, action: () => navigate('/employee/profile'), color: 'bg-purple-600 hover:bg-purple-700' }
  ];

  return (
    <PageContainer>
      {/* Header with Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome back, {user?.personalInfo?.firstName || 'Employee'}!
            </h1>
            <p className="mt-2 text-muted-foreground">
              {dayjs().format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <div className="flex gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={action.action}
                className={`gap-2 ${action.color} text-white`}
                size="sm"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
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
                  <p className="text-sm font-medium text-muted-foreground">Last Salary</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    ₹<CountUp end={data?.currentPayroll?.netSalary || 0} duration={2} separator="," />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(data?.currentPayroll?.month, 'MMM YYYY')}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
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
                  <p className="text-sm font-medium text-muted-foreground">YTD Earnings</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    ₹<CountUp
                      end={data?.ytdEarnings?.totalNet || 0}
                      duration={2}
                      separator=","
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data?.ytdEarnings?.count || 0} payslips this year
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-muted-foreground">Leave Balance</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    <CountUp
                      end={data?.leaveBalance?.Casual?.remaining || 0}
                      duration={2}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Casual leaves remaining</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
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
                  <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    <CountUp end={data?.unreadNotifications || 0} duration={2} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Unread messages</p>
                </div>
                <div className="rounded-lg bg-orange-100 p-3">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Payslip */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Latest Payslip</h3>
                  {data?.currentPayroll?.payslipUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(data.currentPayroll.payslipUrl, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
                {data?.currentPayroll ? (
                  <div className="space-y-3 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Month:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(data.currentPayroll.month, 'MMMM YYYY')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${data.currentPayroll.status === 'Paid'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {data.currentPayroll.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-sm font-semibold text-foreground">Net Salary:</span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(data.currentPayroll.netSalary)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No payslips available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Leaves */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Upcoming Leaves</h3>
                  <Button size="sm" variant="outline" onClick={() => navigate('/employee/leaves')}>
                    View All
                  </Button>
                </div>
                {data?.upcomingLeaves && data.upcomingLeaves.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingLeaves.map((leave, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <div className="rounded-lg bg-purple-100 p-2.5 mt-0.5">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{leave.leaveType} Leave</p>
                            <span className="text-xs text-muted-foreground">{leave.totalDays} days</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 italic">{leave.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No upcoming leaves</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {data?.recentNotifications && data.recentNotifications.length > 0 ? (
                    data.recentNotifications.map((notification, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <div className={`rounded-full p-1.5 ${notification.read ? 'bg-gray-100' : 'bg-blue-100'
                          }`}>
                          <Bell className={`h-3 w-3 ${notification.read ? 'text-gray-600' : 'text-blue-600'
                            }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {dayjs(notification.createdAt).fromNow()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="border">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/employee/profile')}>
                    <Eye className="h-4 w-4 mr-3" />
                    My Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/employee/payslips')}>
                    <FileText className="h-4 w-4 mr-3" />
                    All Payslips
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/employee/leaves')}>
                    <Calendar className="h-4 w-4 mr-3" />
                    Leave History
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/employee/notifications')}>
                    <Bell className="h-4 w-4 mr-3" />
                    All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
};

export default EmployeeDashboard;