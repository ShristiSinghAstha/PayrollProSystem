import { Row, Col, Card, Statistic, Typography, Button, Table, Tag, Space, Divider } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  UserAddOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { usePayrollStats } from '@/hooks/usePayroll';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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
  const { stats: employeeStats, loading: employeeLoading } = useEmployeeStats();
  const { stats: payrollStats, loading: payrollLoading } = usePayrollStats({ month: undefined });

  const loading = employeeLoading || payrollLoading;

  // Department distribution data for pie chart
  const departmentData = employeeStats?.byDepartment?.map(dept => ({
    type: dept._id,
    value: dept.count,
  })) || [];

  // Monthly trend data
  const monthlyTrendData = payrollStats?.byMonth?.slice(0, 6).reverse().map(month => ({
    month: month._id,
    amount: month.totalNet,
  })) || [];

  // Recent activities
  const recentActivities = [
    { id: 1, action: 'Payroll processed for Dec 2025', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'New employee added: John Doe', time: '5 hours ago', type: 'info' },
    { id: 3, action: '15 payrolls approved', time: '1 day ago', type: 'success' },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 24 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Admin Dashboard
            </Title>
            <Text type="secondary">Quick overview of employees and payroll operations</Text>
          </Col>
          <Col>
            <Space>
              <Link to="/admin/employees/new">
                <Button type="default" icon={<UserAddOutlined />} size="large">
                  Add Employee
                </Button>
              </Link>
              <Link to="/admin/payroll">
                <Button type="primary" icon={<DollarOutlined />} size="large">
                  Process Payroll
                </Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </motion.div>

      {/* Key Statistics Cards with CountUp */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={cardVariants}>
              <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Employees</span>}
                  value={employeeStats?.total || 0}
                  prefix={<TeamOutlined />}
                  styles={{ value: { color: '#fff' } }}
                  formatter={(value) => <CountUp end={value} duration={2} />}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={cardVariants}>
              <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Active</span>}
                  value={employeeStats?.active || 0}
                  prefix={<CheckCircleOutlined />}
                  styles={{ value: { color: '#fff' } }}
                  formatter={(value) => <CountUp end={value} duration={2} />}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={cardVariants}>
              <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Pending Payrolls</span>}
                  value={payrollStats?.pending || 0}
                  prefix={<ClockCircleOutlined />}
                  styles={{ value: { color: '#fff' } }}
                  formatter={(value) => <CountUp end={value} duration={2} />}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <motion.div variants={cardVariants}>
              <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Month Payout</span>}
                  value={payrollStats?.currentMonthNet || 0}
                  prefix="₹"
                  precision={0}
                  styles={{ value: { color: '#fff', fontSize: 20 } }}
                  formatter={(value) => <CountUp end={value} duration={2.5} separator="," />}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card
              title={
                <Space>
                  <RiseOutlined style={{ color: '#1890ff' }} />
                  <span>Monthly Payroll Trend</span>
                </Space>
              }
              loading={loading}
            >
              <Column
                data={monthlyTrendData}
                xField="month"
                yField="amount"
                label={{
                  position: 'top',
                  style: {
                    fill: '#000000',
                    opacity: 0.6,
                  },
                }}
                meta={{
                  amount: {
                    alias: 'Net Payout',
                    formatter: (val) => `₹${val?.toLocaleString()}`,
                  },
                }}
                columnStyle={{
                  radius: [8, 8, 0, 0],
                }}
                color="#1890ff"
                height={300}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card
              title={
                <Space>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <span>Department Distribution</span>
                </Space>
              }
              loading={loading}
            >
              <Pie
                data={departmentData}
                angleField="value"
                colorField="type"
                radius={0.8}
                innerRadius={0.6}
                legend={{
                  position: 'bottom',
                }}
                interactions={[{ type: 'element-selected' }, { type: 'element-active' }]}
                height={300}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Status Overview & Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card title="Payroll Status Overview">
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591', textAlign: 'center' }}>
                    <Statistic
                      title="Pending"
                      value={payrollStats?.pending || 0}
                      styles={{ value: { color: '#faad14', fontSize: 24 } }}
                      formatter={(value) => <CountUp end={value} duration={2} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff', textAlign: 'center' }}>
                    <Statistic
                      title="Approved"
                      value={payrollStats?.approved || 0}
                      styles={{ value: { color: '#1890ff', fontSize: 24 } }}
                      formatter={(value) => <CountUp end={value} duration={2} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', textAlign: 'center' }}>
                    <Statistic
                      title="Paid"
                      value={payrollStats?.paid || 0}
                      styles={{ value: { color: '#52c41a', fontSize: 24 } }}
                      formatter={(value) => <CountUp end={value} duration={2} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ background: '#fff1f0', border: '1px solid #ffccc7', textAlign: 'center' }}>
                    <Statistic
                      title="Failed"
                      value={payrollStats?.failed || 0}
                      styles={{ value: { color: '#ff4d4f', fontSize: 24 } }}
                      formatter={(value) => <CountUp end={value} duration={2} />}
                    />
                  </Card>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Text type="secondary">Gross Payout</Text>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff', marginTop: 4 }}>
                    ₹<CountUp end={payrollStats?.currentMonthGross || 0} duration={2.5} separator="," />
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Total Deductions</Text>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f', marginTop: 4 }}>
                    ₹<CountUp end={payrollStats?.currentMonthDeductions || 0} duration={2.5} separator="," />
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card
              title="Recent Activities"
              extra={<Link to="/admin/employees">View All</Link>}
            >
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                {recentActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Card size="small" style={{ background: '#fafafa' }}>
                      <Space>
                        {activity.type === 'success' ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        ) : (
                          <FileTextOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{activity.action}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{activity.time}</Text>
                        </div>
                      </Space>
                    </Card>
                  </motion.div>
                ))}
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{ marginTop: 24 }}
      >
        <Card title="Quick Actions">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/employees/new">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card size="small" hoverable style={{ textAlign: 'center', padding: '20px 0' }}>
                    <UserAddOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                    <div>Add Employee</div>
                  </Card>
                </motion.div>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/payroll">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card size="small" hoverable style={{ textAlign: 'center', padding: '20px 0' }}>
                    <DollarOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                    <div>Process Payroll</div>
                  </Card>
                </motion.div>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/leaves">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card size="small" hoverable style={{ textAlign: 'center', padding: '20px 0' }}>
                    <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                    <div>Leave Approvals</div>
                  </Card>
                </motion.div>
              </Link>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Link to="/admin/reports">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card size="small" hoverable style={{ textAlign: 'center', padding: '20px 0' }}>
                    <FileTextOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                    <div>View Reports</div>
                  </Card>
                </motion.div>
              </Link>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </PageContainer>
  );
};

export default AdminDashboard;