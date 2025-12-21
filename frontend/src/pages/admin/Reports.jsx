import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Typography,
  Space,
  Statistic,
  Divider,
  message
} from 'antd';
import {
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Column, Line, Pie, DualAxes } from '@ant-design/charts';
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { usePayrollStats } from '@/hooks/usePayroll';
import { useEmployeeStats } from '@/hooks/useEmployees';
import { formatCurrency } from '@/utils/formatters';
import axios from '@/api/axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const { stats: payrollStats, loading: payrollLoading } = usePayrollStats();
  const { stats: employeeStats, loading: employeeLoading } = useEmployeeStats();
  const [dateRange, setDateRange] = useState([dayjs().subtract(6, 'month'), dayjs()]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const loading = payrollLoading || employeeLoading;

  // Prepare data for charts
  const monthlyTrendData = (payrollStats?.byMonth || []).slice(0, 6).reverse().map(m => ({
    month: dayjs(m._id).format('MMM YY'),
    gross: m.totalGross,
    deductions: m.totalDeductions,
    net: m.totalNet,
    employees: m.totalEmployees
  }));

  const departmentData = (employeeStats?.byDepartment || []).map(dept => ({
    department: dept._id,
    count: dept.count,
    percentage: ((dept.count / (employeeStats?.total || 1)) * 100).toFixed(1)
  }));

  // Salary distribution data (mock - you can enhance this)
  const salaryDistributionData = [
    { range: '< 30K', count: 12 },
    { range: '30-50K', count: 25 },
    { range: '50-75K', count: 18 },
    { range: '75-100K', count: 10 },
    { range: '> 100K', count: 5 }
  ];

  const handleExportPayroll = async () => {
    try {
      const response = await axios.get('/api/bulk/payroll/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Payroll report exported successfully');
    } catch (error) {
      message.error('Failed to export payroll report');
    }
  };

  const handleExportEmployees = async () => {
    try {
      const response = await axios.get('/api/bulk/employees/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Employee report exported successfully');
    } catch (error) {
      message.error('Failed to export employee report');
    }
  };

  // Column chart config for monthly trends
  const columnConfig = {
    data: monthlyTrendData,
    isGroup: true,
    xField: 'month',
    yField: ['gross', 'net'],
    seriesField: 'name',
    label: {
      position: 'top',
      layout: [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }],
    },
    color: ['#5B8FF9', '#5AD8A6'],
  };

  // Line chart config for payroll trend
  const lineConfig = {
    data: monthlyTrendData,
    xField: 'month',
    yField: 'net',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    color: '#1890ff',
  };

  // Pie chart config for department distribution
  const pieConfig = {
    data: departmentData,
    angleField: 'count',
    colorField: 'department',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}\n{percentage}%',
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
  };

  // Column chart for salary distribution
  const salaryDistConfig = {
    data: salaryDistributionData,
    xField: 'range',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    color: '#722ed1',
  };

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined /> Reports & Analytics
            </Title>
            <Text type="secondary">Comprehensive insights into payroll and employee data</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExportEmployees}>
                Export Employees
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPayroll}>
                Export Payroll
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Date Range:</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              picker="month"
              format="MMM YYYY"
            />
          </Col>
          <Col>
            <Text strong>Department:</Text>
          </Col>
          <Col>
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: 200 }}
            >
              <Option value="all">All Departments</Option>
              {departmentData.map(d => (
                <Option key={d.department} value={d.department}>{d.department}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Employees</span>}
              value={employeeStats?.total || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Active Employees</span>}
              value={employeeStats?.active || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Current Month</span>}
              value={formatCurrency(payrollStats?.currentMonthNet || 0)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: '#43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Avg Salary</span>}
              value={formatCurrency((payrollStats?.currentMonthNet || 0) / (payrollStats?.employeesProcessed || 1))}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#1890ff' }} />
                <span>Monthly Payroll Trend (Last 6 Months)</span>
              </Space>
            }
            loading={loading}
          >
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#52c41a' }} />
                <span>Department Distribution</span>
              </Space>
            }
            loading={loading}
          >
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Salary Distribution"
            loading={loading}
          >
            <Column {...salaryDistConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Payroll Status Overview"
            loading={loading}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Pending"
                  value={payrollStats?.pending || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Approved"
                  value={payrollStats?.approved || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Paid"
                  value={payrollStats?.paid || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Failed"
                  value={payrollStats?.failed || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                  <Statistic
                    title="Gross Payout"
                    value={payrollStats?.currentMonthGross || 0}
                    prefix="₹"
                    precision={0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#fff1f0', border: '1px solid #ffccc7' }}>
                  <Statistic
                    title="Total Deductions"
                    value={payrollStats?.currentMonthDeductions || 0}
                    prefix="₹"
                    precision={0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Department-wise Summary Table */}
      <Card title="Department Summary">
        <Row gutter={16}>
          {departmentData.map((dept, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index} style={{ marginBottom: 16 }}>
              <Card
                size="small"
                style={{
                  background: `hsl(${index * 60}, 70%, 95%)`,
                  border: `1px solid hsl(${index * 60}, 70%, 80%)`
                }}
              >
                <Text strong style={{ fontSize: 16 }}>{dept.department}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{dept.count}</Text>
                  <Text type="secondary"> employees</Text>
                </div>
                <Text type="secondary">{dept.percentage}% of total</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </PageContainer>
  );
};

export default Reports;