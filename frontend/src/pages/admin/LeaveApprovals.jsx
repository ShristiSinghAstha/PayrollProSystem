import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Modal,
    Input,
    Select,
    DatePicker,
    Row,
    Col,
    Statistic,
    message,
    Typography,
    Tooltip
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    FilterOutlined,
    UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { getAllLeaves, approveLeave, rejectLeave, getLeaveStats } from '@/api/leaveApi';
import { formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({ status: 'Pending' });
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [approveModal, setApproveModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
        fetchStats();
    }, [filters]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await getAllLeaves(filters);
            setLeaves(response.data.data);
        } catch (error) {
            message.error('Failed to fetch leave applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getLeaveStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await approveLeave(selectedLeave._id, remarks);
            message.success(`Leave approved for ${selectedLeave.employeeId?.personalInfo?.firstName}`);
            setApproveModal(false);
            setRemarks('');
            setSelectedLeave(null);
            fetchLeaves();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to approve leave');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            message.error('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            await rejectLeave(selectedLeave._id, rejectionReason);
            message.success(`Leave rejected for ${selectedLeave.employeeId?.personalInfo?.firstName}`);
            setRejectModal(false);
            setRejectionReason('');
            setSelectedLeave(null);
            fetchLeaves();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to reject leave');
        } finally {
            setActionLoading(false);
        }
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
            'LOP': 'default',
            'Maternity': 'purple',
            'Paternity': 'cyan'
        };
        return colors[type] || 'default';
    };

    const columns = [
        {
            title: 'Employee',
            key: 'employee',
            width: 200,
            fixed: 'left',
            render: (_, record) => (
                <Space>
                    <UserOutlined style={{ color: '#1890ff' }} />
                    <div>
                        <Text strong>
                            {record.employeeId?.personalInfo?.firstName} {record.employeeId?.personalInfo?.lastName}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.employeeId?.employeeId} • {record.employeeId?.employment?.department}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Leave Type',
            dataIndex: 'leaveType',
            key: 'leaveType',
            width: 130,
            render: (type) => <Tag color={getLeaveTypeColor(type)}>{type}</Tag>,
            filters: [
                { text: 'Casual', value: 'Casual' },
                { text: 'Sick', value: 'Sick' },
                { text: 'Earned', value: 'Earned' },
                { text: 'LOP', value: 'LOP' },
            ],
        },
        {
            title: 'Duration',
            key: 'duration',
            width: 220,
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
            width: 250,
            render: (reason) => (
                <Tooltip title={reason}>
                    <Text type="secondary">{reason}</Text>
                </Tooltip>
            ),
        },
        {
            title: 'Applied On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (date) => dayjs(date).format('DD MMM YYYY'),
            sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
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
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'Approved', value: 'Approved' },
                { text: 'Rejected', value: 'Rejected' },
            ],
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                record.status === 'Pending' ? (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeave(record);
                                setApproveModal(true);
                            }}
                        >
                            Approve
                        </Button>
                        <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeave(record);
                                setRejectModal(true);
                            }}
                        >
                            Reject
                        </Button>
                    </Space>
                ) : (
                    <Tag color={getStatusColor(record.status)}>
                        {record.status}
                    </Tag>
                )
            ),
        },
    ];

    return (
        <PageContainer>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Leave Management
                </Title>
                <Text type="secondary">Review and manage employee leave applications</Text>
            </div>

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#fff7e6' }}>
                        <Statistic
                            title="Pending Approvals"
                            value={stats?.byStatus?.pending?.count || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                            suffix={<span style={{ fontSize: 14 }}>{stats?.byStatus?.pending?.totalDays || 0} days</span>}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f6ffed' }}>
                        <Statistic
                            title="Approved This Year"
                            value={stats?.byStatus?.approved?.count || 0}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                            suffix={<span style={{ fontSize: 14 }}>{stats?.byStatus?.approved?.totalDays || 0} days</span>}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#fff1f0' }}>
                        <Statistic
                            title="Rejected"
                            value={stats?.byStatus?.rejected?.count || 0}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                            suffix={<span style={{ fontSize: 14 }}>{stats?.byStatus?.rejected?.totalDays || 0} days</span>}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                        <Text strong>Status:</Text>
                        <Select
                            value={filters.status}
                            onChange={(value) => setFilters({ ...filters, status: value })}
                            style={{ width: '100%', marginTop: 8 }}
                            size="large"
                        >
                            <Option value="">All</Option>
                            <Option value="Pending">Pending</Option>
                            <Option value="Approved">Approved</Option>
                            <Option value="Rejected">Rejected</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Text strong>Leave Type:</Text>
                        <Select
                            value={filters.leaveType}
                            onChange={(value) => setFilters({ ...filters, leaveType: value })}
                            style={{ width: '100%', marginTop: 8 }}
                            size="large"
                            allowClear
                        >
                            <Option value="Casual">Casual</Option>
                            <Option value="Sick">Sick</Option>
                            <Option value="Earned">Earned</Option>
                            <Option value="LOP">LOP</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Leave Applications Table */}
            <Card>
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
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* Approve Modal */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Approve Leave Application</span>
                    </Space>
                }
                open={approveModal}
                onCancel={() => {
                    setApproveModal(false);
                    setRemarks('');
                }}
                onOk={handleApprove}
                confirmLoading={actionLoading}
                okText="Approve Leave"
                okButtonProps={{ icon: <CheckCircleOutlined /> }}
            >
                {selectedLeave && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Employee:</Text>
                        <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                            <Text>{selectedLeave.employeeId?.personalInfo?.firstName} {selectedLeave.employeeId?.personalInfo?.lastName}</Text>
                            <br />
                            <Text type="secondary">{selectedLeave.employeeId?.employeeId}</Text>
                        </div>
                    </div>
                )}
                {selectedLeave && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Duration:</Text>
                        <div style={{ marginTop: 8 }}>
                            <Tag color="blue">{selectedLeave.leaveType}</Tag>
                            <Text>{formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</Text>
                            <Text strong> ({selectedLeave.totalDays} days)</Text>
                        </div>
                    </div>
                )}
                <div>
                    <Text strong>Remarks (Optional):</Text>
                    <TextArea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add any remarks for this approval"
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title={
                    <Space>
                        <CloseCircleOutlined style={{ color: '#cf1322' }} />
                        <span>Reject Leave Application</span>
                    </Space>
                }
                open={rejectModal}
                onCancel={() => {
                    setRejectModal(false);
                    setRejectionReason('');
                }}
                onOk={handleReject}
                confirmLoading={actionLoading}
                okText="Reject Leave"
                okButtonProps={{ danger: true, icon: <CloseCircleOutlined /> }}
            >
                {selectedLeave && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Employee:</Text>
                        <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                            <Text>{selectedLeave.employeeId?.personalInfo?.firstName} {selectedLeave.employeeId?.personalInfo?.lastName}</Text>
                            <br />
                            <Text type="secondary">{selectedLeave.employeeId?.employeeId}</Text>
                        </div>
                    </div>
                )}
                <div>
                    <Text strong>Rejection Reason <Text type="danger">*</Text>:</Text>
                    <TextArea
                        rows={4}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a clear reason for rejection"
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

export default LeaveApprovals;
