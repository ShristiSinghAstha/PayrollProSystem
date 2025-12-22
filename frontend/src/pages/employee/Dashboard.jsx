import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, DollarSign, TrendingUp, Bell } from "lucide-react";
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatCurrency, formatDate } from '@/utils/formatters';

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

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {data?.employee?.personalInfo?.firstName}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here's what's happening with your account today.
        </p>
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
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    ₹<CountUp end={data?.currentPayroll?.netSalary || 0} duration={2} separator="," />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
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
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Payslips</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={data?.recentPayslips?.length || 0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
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
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    <CountUp end={data?.unreadNotifications || 0} duration={2} />
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Latest Payslip</h3>
              {data?.currentPayroll ? (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
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
                    <span className="text-lg font-bold text-foreground">
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {data?.recentNotifications?.slice(0, 3).map((notification, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <Bell className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No notifications</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default EmployeeDashboard;