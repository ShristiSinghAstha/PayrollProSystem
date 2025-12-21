import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Tooltip,
  message
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { Upload, Modal } from 'antd';
import PageContainer from '@/components/layout/PageContainer';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DEPARTMENTS } from '@/utils/constants';
import axios from '@/api/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const [tablePagination, setTablePagination] = useState({ current: 1, pageSize: 10 });
  const [importModal, setImportModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { employees, loading, refetch, pagination } = useEmployees({ ...filters, page: tablePagination.current, limit: tablePagination.pageSize });

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Inactive': 'default',
      'Terminated': 'error',
      'Resigned': 'warning'
    };
    return colors[status] || 'default';
  };

  const calculateGrossSalary = (salaryStructure) => {
    return (salaryStructure.basicSalary || 0) +
      (salaryStructure.hra || 0) +
      (salaryStructure.da || 0) +
      (salaryStructure.specialAllowance || 0) +
      (salaryStructure.otherAllowances || 0);
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 130,
      fixed: 'left',
      sorter: (a, b) => a.employeeId.localeCompare(b.employeeId),
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      width: 200,
      sorter: (a, b) => {
        const nameA = `${a.personalInfo.firstName} ${a.personalInfo.lastName}`;
        const nameB = `${b.personalInfo.firstName} ${b.personalInfo.lastName}`;
        return nameA.localeCompare(nameB);
      },
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <div>
            <Text strong>
              {record.personalInfo.firstName} {record.personalInfo.lastName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.personalInfo.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: ['employment', 'department'],
      key: 'department',
      width: 140,
      filters: DEPARTMENTS.map(dept => ({ text: dept, value: dept })),
      onFilter: (value, record) => record.employment.department === value,
      render: (dept) => (
        <Tag color="blue" icon={<TeamOutlined />}>
          {dept}
        </Tag>
      ),
    },
    {
      title: 'Designation',
      dataIndex: ['employment', 'designation'],
      key: 'designation',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Gross Salary',
      key: 'salary',
      width: 140,
      align: 'right',
      sorter: (a, b) => calculateGrossSalary(a.salaryStructure) - calculateGrossSalary(b.salaryStructure),
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(calculateGrossSalary(record.salaryStructure))}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: ['employment', 'status'],
      key: 'status',
      width: 110,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
        { text: 'Terminated', value: 'Terminated' },
        { text: 'Resigned', value: 'Resigned' },
      ],
      onFilter: (value, record) => record.employment.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: ['employment', 'dateOfJoining'],
      key: 'dateOfJoining',
      width: 120,
      sorter: (a, b) => new Date(a.employment.dateOfJoining) - new Date(b.employment.dateOfJoining),
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/employees/${record._id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/employees/${record._id}`);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pag, filters, sorter) => {
    setTablePagination({
      current: pag.current,
      pageSize: pag.pageSize,
    });
  };

  const handleRefresh = () => {
    refetch();
    message.success('Data refreshed successfully');
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/bulk/employees/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Template downloaded successfully');
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/bulk/employees/export', {
        params: { department: filters.department, status: filters.status },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Employees exported successfully');
    } catch (error) {
      message.error('Failed to export employees');
    }
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);

    try {
      setUploading(true);
      const response = await axios.post('/api/bulk/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { data } = response.data;
      message.success(`Successfully imported ${data.successful} employees`);

      if (data.errors.length > 0) {
        Modal.warning({
          title: 'Import completed with errors',
          content: `${data.successful} employees imported successfully. ${data.failed} failed. Check console for details.`,
          width: 600
        });
        console.error('Import errors:', data.errors);
      }

      setImportModal(false);
      setFileList([]);
      refetch();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to import employees');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isCSV) {
        message.error('You can only upload CSV or Excel files!');
        return false;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Employees
            </Title>
            <Text type="secondary">Manage employee records and information</Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setImportModal(true)}
              >
                Import
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/admin/employees/new')}
              >
                Add Employee
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card>
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={10} lg={8}>
            <Input
              placeholder="Search by name, email, or employee ID"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <Select
              placeholder="Department"
              style={{ width: '100%' }}
              value={filters.department || undefined}
              onChange={(value) => setFilters((prev) => ({ ...prev, department: value || '' }))}
              allowClear
              size="large"
            >
              {DEPARTMENTS.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value || '' }))}
              allowClear
              size="large"
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Terminated">Terminated</Option>
              <Option value="Resigned">Resigned</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={2} lg={6} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="large"
            >
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: tablePagination.current,
            pageSize: tablePagination.pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => navigate(`/admin/employees/${record._id}`),
          })}
        />
      </Card>

      {/* Import Modal */}
      <Modal
        title="Import Employees"
        open={importModal}
        onCancel={() => {
          setImportModal(false);
          setFileList([]);
        }}
        onOk={handleImport}
        confirmLoading={uploading}
        okText={uploading ? 'Uploading...' : 'Import'}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Upload a CSV or Excel file to import multiple employees at once.</Text>
        </div>

        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for CSV or Excel files. Maximum file size: 5MB
          </p>
        </Upload.Dragger>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Don't have a template?{' '}
            <Button type="link" onClick={handleDownloadTemplate} style={{ padding: 0 }}>
              Download Template
            </Button>
          </Text>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default EmployeeList;
