import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Result, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

const { Title, Text } = Typography;

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            setEmail(values.email);
            await axios.post('/api/auth/forgot-password', { email: values.email });
            setEmailSent(true);
            message.success('Password reset link sent to your email');
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Card style={{ width: '100%', maxWidth: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                    <Result
                        status="success"
                        title="Check Your Email"
                        subTitle={`We've sent a password reset link to ${email}. The link will expire in 1 hour.`}
                        extra={[
                            <Link to="/login" key="login">
                                <Button type="primary" icon={<ArrowLeftOutlined />}>
                                    Back to Login
                                </Button>
                            </Link>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                        Forgot Password?
                    </Title>
                    <Text type="secondary">
                        Enter your email address and we'll send you a link to reset your password
                    </Text>
                </div>

                <Form
                    name="forgot-password"
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="site-form-item-icon" />}
                            placeholder="your.email@company.com"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            size="large"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/login">
                            <Button type="link" icon={<ArrowLeftOutlined />}>
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default ForgotPassword;
