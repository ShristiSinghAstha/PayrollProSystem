import { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Form,
    Select,
    DatePicker,
    Input,
    Row,
    Col,
    Table,
    Tag,
    Statistic,
    Typography,
    Space,
    message,
    Progress,
    Modal
} from 'antd';
import {
    PlusOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { applyLeave, getMyLeaves, deleteLeave } from '@/api/leaveApi';
import { formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MyLeaves = () => {
    const [form] = Form.useForm();
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await getMyLeaves(new Date().getFullYear());
            setLeaves(response.data.data.leaves);
            setBalance(response.data.data.balance);
        } catch (error) {
            message.error('Failed to fetch leave data');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = async (values) => {
        const { leaveType, dateRange, reason } = values;
        const [startDate, endDate] = dateRange;

        try {
            setApplying(true);
            await applyLeave({
                leaveType,
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
                reason
            });
            message.success('Leave application submitted successfully!');
            setShowApplyModal(false);
            form.resetFields();
            fetchLeaves();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to apply for leave');
        } finally {
            setApplying(false);
        }
    };

    const handleDeleteLeave = (leaveId) => {
        Modal.confirm({
            title: 'Delete Leave Application',
            icon: <ExclamationCircleOutlined />,
            content: 'Are you sure you want to delete this leave application? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deleteLeave(leaveId);
                    message.success('Leave application deleted successfully');
                    fetchLeaves();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Failed to delete leave');
                }
            }
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'orange',
            'Approved': 'success',
            'Rejected': 'error'
        };
        return colors[status] || 'default';
    };

    const getLeaveTypeColor = (type) => {
        const colors = {
            'Casual': 'blue',
            'Sick': 'red',
            'Earned': 'green',
            'LOP': 'default'
        };
        return colors[type] || 'default';
    };

    const columns = [
        {
            title: 'Leave Type',
            dataIndex: 'leaveType',
            key: 'leaveType',
            width: 120,
            render: (type) => <Tag color={getLeaveTypeColor(type)}>{type}</Tag>,
        },
        {
            title: 'Duration',
            key: 'duration',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Text>{formatDate(record.startDate)} → {formatDate(record.endDate)}</Text>
                    <Tag icon={<CalendarOutlined />} color="blue">
                        {record.totalDays} {record.totalDays > 1 ? 'days' : 'day'}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag
                    icon={
                        status === 'Pending' ? <ClockCircleOutlined /> :
                            status === 'Approved' ? <CheckCircleOutlined /> :
                                <CloseCircleOutlined />
                    }
                    color={getStatusColor(status)}
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Applied On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 130,
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                record.status === 'Pending' && (
                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteLeave(record._id)}
                    >
                        Delete
                    </Button>
                )
            ),
        },
    ];

    return (
        <PageContainer>
            <div style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            My Leaves
                        </Title>
                        <Text type="secondary">Manage your leave applications and track balance</Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={() => setShowApplyModal(true)}
                        >
                            Apply for Leave
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Leave Balance Cards */}
            {balance && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Casual Leave</span>}
                                value={balance.Casual?.remaining || 0}
                                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>/ {balance.Casual?.allocated || 12}</span>}
                                valueStyle={{ color: '#fff' }}
                            />
                            <Progress
                                percent={(balance.Casual?.remaining / balance.Casual?.allocated) * 100}
                                strokeColor="#fff"
                                trailColor="rgba(255,255,255,0.3)"
                                showInfo={false}
                                style={{ marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Sick Leave</span>}
                                value={balance.Sick?.remaining || 0}
                                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>/ {balance.Sick?.allocated || 12}</span>}
                                valueStyle={{ color: '#fff' }}
                            />
                            <Progress
                                percent={(balance.Sick?.remaining / balance.Sick?.allocated) * 100}
                                strokeColor="#fff"
                                trailColor="rgba(255,255,255,0.3)"
                                showInfo={false}
                                style={{ marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Earned Leave</span>}
                                value={balance.Earned?.remaining || 0}
                                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>/ {balance.Earned?.allocated || 18}</span>}
                                valueStyle={{ color: '#fff' }}
                            />
                            <Progress
                                percent={(balance.Earned?.remaining / balance.Earned?.allocated) * 100}
                                strokeColor="#fff"
                                trailColor="rgba(255,255,255,0.3)"
                                showInfo={false}
                                style={{ marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>LOP Days Used</span>}
                                value={balance.LOP?.used || 0}
                                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>days</span>}
                                valueStyle={{ color: '#fff' }}
                            />
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Loss of Pay</Text>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Leave Applications Table */}
            <Card title="Leave History">
                <Table
                    columns={columns}
                    dataSource={leaves}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} leave applications`,
                    }}
                />
            </Card>

            {/* Apply Leave Modal */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined style={{ color: '#1890ff' }} />
                        <span>Apply for Leave</span>
                    </Space>
                }
                open={showApplyModal}
                onCancel={() => {
                    setShowApplyModal(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleApplyLeave}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        name="leaveType"
                        label="Leave Type"
                        rules={[{ required: true, message: 'Please select leave type' }]}
                    >
                        <Select size="large" placeholder="Select leave type">
                            <Option value="Casual">Casual Leave (Available: {balance?.Casual?.remaining || 0})</Option>
                            <Option value="Sick">Sick Leave (Available: {balance?.Sick?.remaining || 0})</Option>
                            <Option value="Earned">Earned Leave (Available: {balance?.Earned?.remaining || 0})</Option>
                            <Option value="LOP">LOP (Loss of Pay)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Select Dates"
                        rules={[{ required: true, message: 'Please select date range' }]}
                    >
                        <RangePicker
                            size="large"
                            style={{ width: '100%' }}
                            format="DD-MM-YYYY"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Reason"
                        rules={[
                            { required: true, message: 'Please provide reason for leave' },
                            { max: 500, message: 'Reason cannot exceed 500 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Provide a brief reason for your leave application"
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        < Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => {
                                setShowApplyModal(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={applying} icon={<CalendarOutlined />}>
                                {applying ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default MyLeaves;
