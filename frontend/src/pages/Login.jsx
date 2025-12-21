import { useState } from 'react';
import { motion } from 'framer-motion';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Login successful! Welcome back.');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 450 }}
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <LoginOutlined style={{ fontSize: 36, color: '#667eea' }} />
          </div>
          <Title level={1} style={{ color: 'white', margin: 0, fontSize: 36 }}>
            PayrollPro
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
            Professional Payroll Management
          </Text>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 16,
              border: 'none',
            }}
          >
            <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
              Welcome Back
            </Title>
            <Paragraph
              style={{ textAlign: 'center', color: '#8c8c8c', marginBottom: 32 }}
            >
              Sign in to access your dashboard
            </Paragraph>

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Email Address"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <a
                  href="/forgot-password"
                  style={{ color: '#667eea', fontWeight: 500 }}
                >
                  Forgot Password?
                </a>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<LoginOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>

            {/* Demo Credentials */}
            <Card
              size="small"
              style={{
                marginTop: 24,
                background: '#f5f5f5',
                border: '1px dashed #d9d9d9',
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                🔑 Demo Credentials:
              </Text>
              <div style={{ fontSize: 13, lineHeight: '22px' }}>
                <div>
                  <Text strong>Admin:</Text> admin@payrollpro.com / admin123
                </div>
                <div>
                  <Text strong>Employee:</Text> employee@payrollpro.com / emp123
                </div>
              </div>
            </Card>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            © 2024 PayrollPro. All rights reserved.
          </Text>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;