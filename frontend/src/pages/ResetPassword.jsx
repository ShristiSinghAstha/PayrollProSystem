import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Result, message } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const response = await axios.post(`/api/auth/reset-password/${token}`, {
                password: values.password
            });

            // Save the new token
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            setResetSuccess(true);
            message.success('Password reset successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (resetSuccess) {
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
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Password Reset Successfully!"
                        subTitle="Redirecting you to login page..."
                        extra={[
                            <Link to="/login" key="login">
                                <Button type="primary">
                                    Go to Login
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
                        Reset Password
                    </Title>
                    <Text type="secondary">
                        Enter your new password below
                    </Text>
                </div>

                <Form
                    name="reset-password"
                    onFinish={handleSubmit}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="password"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please enter your new password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="Enter new password"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm Password"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon" />}
                            placeholder="Confirm new password"
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
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/login">
                            <Button type="link">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPassword;
