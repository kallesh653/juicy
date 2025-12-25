import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tag,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TableOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const { Option } = Select;

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tables');
      console.log('Tables fetched:', response.data);
      setTables(response.data.tables || []);
    } catch (error) {
      message.error('Failed to fetch tables');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTable(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    form.setFieldsValue(table);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tables/${id}`);
      message.success('Table deleted successfully');
      fetchTables();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete table');
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, values);
        message.success('Table updated successfully');
      } else {
        await api.post('/tables', values);
        message.success('Table created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchTables();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Table No',
      dataIndex: 'tableNumber',
      key: 'tableNumber',
      render: (text) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Table Name',
      dataIndex: 'tableName',
      key: 'tableName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Capacity',
      dataIndex: 'seatingCapacity',
      key: 'seatingCapacity',
      align: 'center',
      render: (capacity) => `${capacity} seats`,
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      render: (floor) => <Tag color="purple">{floor}</Tag>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => <Tag color="orange">{location}</Tag>,
    },
    {
      title: 'Shape',
      dataIndex: 'shape',
      key: 'shape',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={
            status === 'Available' ? 'success' :
            status === 'Occupied' ? 'error' :
            status === 'Reserved' ? 'warning' : 'default'
          }
          text={status}
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Table"
            description={
              record.status === 'Occupied'
                ? 'This table is occupied. Are you sure you want to delete it?'
                : 'Are you sure you want to delete this table?'
            }
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TableOutlined style={{ marginRight: 8, fontSize: 24, color: '#667eea' }} />
              <span style={{ fontSize: 20, fontWeight: 600 }}>Table Management</span>
            </div>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTables}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Add New Table
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={tables}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tables`,
            }}
          />
        </Card>

        <Modal
          title={
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </div>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              seatingCapacity: 4,
              floor: 'Ground',
              location: 'Indoor',
              shape: 'Square',
              status: 'Available',
              isActive: true,
            }}
          >
            <Form.Item
              label="Table Number"
              name="tableNumber"
              rules={[
                { required: true, message: 'Please enter table number' },
                { pattern: /^[A-Z0-9]+$/, message: 'Use uppercase letters and numbers only' }
              ]}
            >
              <Input
                placeholder="e.g., T1, B1, V1"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <Form.Item
              label="Table Name"
              name="tableName"
              rules={[{ required: true, message: 'Please enter table name' }]}
            >
              <Input placeholder="e.g., Window Table 1" />
            </Form.Item>

            <Form.Item
              label="Seating Capacity"
              name="seatingCapacity"
              rules={[{ required: true, message: 'Please enter capacity' }]}
            >
              <InputNumber
                min={1}
                max={20}
                style={{ width: '100%' }}
                placeholder="Number of seats"
              />
            </Form.Item>

            <Form.Item
              label="Floor"
              name="floor"
              rules={[{ required: true, message: 'Please select floor' }]}
            >
              <Select placeholder="Select floor">
                <Option value="Ground">Ground Floor</Option>
                <Option value="First">First Floor</Option>
                <Option value="Second">Second Floor</Option>
                <Option value="Rooftop">Rooftop</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true, message: 'Please select location' }]}
            >
              <Select placeholder="Select location">
                <Option value="Indoor">Indoor</Option>
                <Option value="Outdoor">Outdoor</Option>
                <Option value="Balcony">Balcony</Option>
                <Option value="VIP">VIP</Option>
                <Option value="Garden">Garden</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Shape"
              name="shape"
              rules={[{ required: true, message: 'Please select shape' }]}
            >
              <Select placeholder="Select table shape">
                <Option value="Square">Square</Option>
                <Option value="Round">Round</Option>
                <Option value="Rectangle">Rectangle</Option>
                <Option value="Booth">Booth</Option>
              </Select>
            </Form.Item>

            {editingTable && (
              <Form.Item
                label="Status"
                name="status"
              >
                <Select>
                  <Option value="Available">Available</Option>
                  <Option value="Reserved">Reserved</Option>
                  <Option value="Maintenance">Maintenance</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item
              label="Description (Optional)"
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Any additional details about the table"
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  {editingTable ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default TableManagement;
