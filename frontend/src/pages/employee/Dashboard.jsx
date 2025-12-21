import { Row, Col, Card, Statistic, Typography, Button, Tag, Space, Divider } from 'antd';
import {
  DollarOutlined,
  BellOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
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

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useEmployeeDashboard();

  const currentPayroll = data?.currentPayroll;
  const recentPayslips = data?.recentPayslips || [];
  const unreadNotifications = data?.unreadNotifications || 0;

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'orange',
      Approved: 'blue',
      Paid: 'green',
      Failed: 'red'
    };
    return colors[status] || 'default';
  };

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 32 }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Welcome, {user?.personalInfo?.firstName || 'User'}! 👋
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Here's your payroll overview
        </Text>
      </motion.div>

      {loading ? (
        <Card loading={true} style={{ minHeight: 400 }} />
      ) : error ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="danger" style={{ fontSize: 16 }}>Unable to load dashboard</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row gutter={[16, 16]}>
            {/* Current Month Salary - Large Card */}
            <Col xs={24} lg={16}>
              <motion.div variants={cardVariants}>
                <Card
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    minHeight: 220
                  }}
                >
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                        Current Month Salary
                      </Text>
                    </div>
                    {currentPayroll ? (
                      <>
                        <div>
                          <Title level={3} style={{ color: 'white', margin: 0 }}>
                            {formatMonth(currentPayroll.month)}
                          </Title>
                          <Title level={1} style={{ color: 'white', margin: '8px 0', fontSize: 42 }}>
                            ₹<CountUp end={currentPayroll.netSalary} duration={2.5} separator="," />
                          </Title>
                          <Tag color={getStatusColor(currentPayroll.status)} style={{ fontSize: 14 }}>
                            {currentPayroll.status}
                          </Tag>
                        </div>
                        <div>
                          {currentPayroll.status === 'Paid' && currentPayroll.payslipGenerated && (
                            <Button
                              type="default"
                              icon={<DownloadOutlined />}
                              onClick={() => navigate('/employee/payslips')}
                              size="large"
                              style={{ background: 'white' }}
                            >
                              Download Payslip
                            </Button>
                          )}
                          {currentPayroll.status === 'Pending' && (
                            <Space>
                              <ClockCircleOutlined style={{ color: 'white', fontSize: 18 }} />
                              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Payroll is being processed
                              </Text>
                            </Space>
                          )}
                          {currentPayroll.status === 'Approved' && (
                            <Space>
                              <CheckCircleOutlined style={{ color: 'white', fontSize: 18 }} />
                              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                                Payment will be processed soon
                              </Text>
                            </Space>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                          No payroll processed yet for this month
                        </Text>
                        <br />
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                          Your payslip will appear here once processed
                        </Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </motion.div>
            </Col>

            {/* Notifications Card */}
            <Col xs={24} lg={8}>
              <motion.div variants={cardVariants}>
                <Card
                  style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                    minHeight: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <BellOutlined style={{ fontSize: 48, color: 'white', marginBottom: 16 }} />
                    <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
                      <CountUp end={unreadNotifications} duration={2} />
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
                      Unread Notifications
                    </Text>
                    <div style={{ marginTop: 20 }}>
                      <Button
                        type="default"
                        onClick={() => navigate('/employee/notifications')}
                        style={{ background: 'white' }}
                      >
                        View All
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>

            {/* Quick Actions */}
            <Col xs={24}>
              <motion.div variants={cardVariants}>
                <Card title="Quick Actions">
                  <Row gutter={16}>
                    <Col xs={12} sm={6}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          hoverable
                          size="small"
                          onClick={() => navigate('/employee/payslips')}
                          style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                          <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                          <div>My Payslips</div>
                        </Card>
                      </motion.div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          hoverable
                          size="small"
                          onClick={() => navigate('/employee/leaves')}
                          style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                          <CalendarOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                          <div>My Leaves</div>
                        </Card>
                      </motion.div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          hoverable
                          size="small"
                          onClick={() => navigate('/employee/notifications')}
                          style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                          <BellOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                          <div>Notifications</div>
                        </Card>
                      </motion.div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          hoverable
                          size="small"
                          onClick={() => navigate('/employee/profile')}
                          style={{ textAlign: 'center', padding: '20px 0' }}
                        >
                          <DollarOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                          <div>My Profile</div>
                        </Card>
                      </motion.div>
                    </Col>
                  </Row>
                </Card>
              </motion.div>
            </Col>

            {/* Recent Payslips */}
            <Col xs={24}>
              <motion.div variants={cardVariants}>
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#1890ff' }} />
                      <span>Recent Payslips</span>
                    </Space>
                  }
                  extra={<Button type="link" onClick={() => navigate('/employee/payslips')}>View All</Button>}
                >
                  {recentPayslips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: 16 }}>No payslips available yet</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Your payslips will appear here once generated</Text>
                      </div>
                    </div>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {recentPayslips.map((payslip, index) => (
                        <motion.div
                          key={payslip._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                        >
                          <Card size="small" style={{ background: '#fafafa' }}>
                            <Row justify="space-between" align="middle">
                              <Col>
                                <Text strong style={{ fontSize: 16 }}>{formatMonth(payslip.month)}</Text>
                                <br />
                                <Text type="secondary">₹<CountUp end={payslip.netSalary} duration={1.5} separator="," /></Text>
                              </Col>
                              <Col>
                                <Button
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  onClick={() => navigate('/employee/payslips')}
                                >
                                  Download
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        </motion.div>
                      ))}
                    </Space>
                  )}
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      )}
    </PageContainer>
  );
};

export default EmployeeDashboard;