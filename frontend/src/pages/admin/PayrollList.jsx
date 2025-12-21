import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Table,
    Button,
    Modal,
    DatePicker,
    Typography,
    Row,
    Col,
    Tag,
    Space,
    Statistic,
    message
} from 'antd';
import {
    PlusOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { usePayroll } from '@/hooks/usePayroll';
import { useProcessPayroll } from '@/hooks/useProcessPayroll';
import { getMonthlyPayrollSummary } from '@/api/payrollApi';
import { formatCurrency } from '@/utils/formatters';

const { Title, Text } = Typography;

const PayrollList = () => {
    const [filters] = useState({});
    const [summaries, setSummaries] = useState([]);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [loadingSummaries, setLoadingSummaries] = useState(true);

    const navigate = useNavigate();
    const { payrolls, loading, refetch } = usePayroll(filters);
    const { process, loading: processing } = useProcessPayroll();

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            setLoadingSummaries(true);
            const res = await getMonthlyPayrollSummary();
            setSummaries(res.data.data);
        } catch (error) {
            console.error('Failed to fetch summaries:', error);
            message.error('Failed to load payroll summaries');
        } finally {
            setLoadingSummaries(false);
        }
    };

    const columns = [
        {
            title: 'Month',
            dataIndex: 'month',
            key: 'month',
            width: 150,
            render: (month) => (
                <Space>
                    <CalendarOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{dayjs(month).format('MMMM YYYY')}</Text>
                </Space>
            ),
            sorter: (a, b) => dayjs(a.month).unix() - dayjs(b.month).unix(),
        },
        {
            title: 'Total Employees',
            dataIndex: 'totalEmployees',
            key: 'totalEmployees',
            width: 150,
            align: 'center',
            render: (count) => (
                <Tag icon={<TeamOutlined />} color="blue">
                    {count} Employees
                </Tag>
            ),
        },
        {
            title: 'Status Breakdown',
            key: 'status',
            width: 300,
            render: (_, record) => (
                <Space size="small">
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                        Pending: {record.pending}
                    </Tag>
                    <Tag color="blue">Approved: {record.approved}</Tag>
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Paid: {record.paid}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Last Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 180,
            render: (date) => dayjs(date).format('DD MMM YYYY, HH:mm'),
            sorter: (a, b) => dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/payroll/${record.month}`);
                    }}
                >
                    View Details
                </Button>
            ),
        },
    ];

    const handleProcess = async () => {
        const monthStr = selectedMonth.format('YYYY-MM');
        const [year, monthNum] = monthStr.split('-');

        try {
            await process({
                month: parseInt(monthNum, 10),
                year: parseInt(year, 10),
            });
            message.success(`Payroll for ${selectedMonth.format('MMMM YYYY')} processed successfully!`);
            setShowProcessModal(false);
            await fetchSummaries();
            refetch();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to process payroll');
        }
    };

    // Calculate totals
    const totals = summaries.reduce(
        (acc, curr) => ({
            totalEmployees: acc.totalEmployees + (curr.totalEmployees || 0),
            pending: acc.pending + (curr.pending || 0),
            paid: acc.paid + (curr.paid || 0),
        }),
        { totalEmployees: 0, pending: 0, paid: 0 }
    );

    return (
        <PageContainer>
            <div style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            Payroll Management
                        </Title>
                        <Text type="secondary">Manage monthly payroll cycles and employee payments</Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={() => setShowProcessModal(true)}
                        >
                            Process New Payroll
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Summary Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f0f5ff' }}>
                        <Statistic
                            title="Total Payroll Cycles"
                            value={summaries.length}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#fff7e6' }}>
                        <Statistic
                            title="Pending Approvals"
                            value={totals.pending}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} style={{ background: '#f6ffed' }}>
                        <Statistic
                            title="Completed Payments"
                            value={totals.paid}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Payroll Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={summaries}
                    rowKey="month"
                    loading={loadingSummaries}
                    pagination={{
                        pageSize: 12,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} payroll cycles`,
                    }}
                    onRow={(record) => ({
                        style: { cursor: 'pointer' },
                        onClick: () => navigate(`/admin/payroll/${record.month}`),
                    })}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                <DollarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <div>
                                    <Text type="secondary" style={{ fontSize: 16 }}>No payroll records yet</Text>
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowProcessModal(true)}>
                                        Process First Payroll
                                    </Button>
                                </div>
                            </div>
                        ),
                    }}
                />
            </Card>

            {/* Process Payroll Modal */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined style={{ color: '#1890ff' }} />
                        <span>Process New Payroll</span>
                    </Space>
                }
                open={showProcessModal}
                onCancel={() => setShowProcessModal(false)}
                onOk={handleProcess}
                confirmLoading={processing}
                okText={processing ? 'Processing...' : 'Process Payroll'}
                width={500}
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Select Month</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                            Choose the month for which you want to process payroll
                        </Text>
                    </div>

                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        onChange={(date) => setSelectedMonth(date)}
                        format="MMMM YYYY"
                        size="large"
                        style={{ width: '100%' }}
                        disabledDate={(current) => current && current > dayjs().endOf('month')}
                    />

                    <Card
                        size="small"
                        style={{ marginTop: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}
                    >
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            This will fetch all <Text strong>active employees</Text> and create payroll records for{' '}
                            <Text strong style={{ color: '#1890ff' }}>
                                {selectedMonth.format('MMMM YYYY')}
                            </Text>
                            . Salary will be calculated based on their current salary structure.
                        </Text>
                    </Card>
                </div>
            </Modal>
        </PageContainer>
    );
};

export default PayrollList;