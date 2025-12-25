import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Badge,
  Statistic,
  Button,
  Select,
  Space,
  Spin,
  message,
  Modal,
  Empty,
  Tooltip
} from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const { Option } = Select;

const TablesView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    setUser(userData);
    fetchTables();
    fetchStats();
  }, [location.pathname]); // Refetch when navigating back to this page

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tables');
      console.log('Tables fetched:', response.data);
      setTables(response.data.tables || []);
    } catch (error) {
      message.error('Failed to fetch tables: ' + (error.response?.data?.message || error.message));
      console.error('Fetch tables error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/tables/stats/summary');
      console.log('Stats fetched:', response.data);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      message.error('Failed to fetch statistics');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: '#52c41a',
      Occupied: '#ff4d4f',
      Reserved: '#faad14',
      Maintenance: '#8c8c8c'
    };
    return colors[status] || '#d9d9d9';
  };

  const getStatusIcon = (status) => {
    if (status === 'Available') return <CheckCircleOutlined />;
    if (status === 'Occupied') return <UserOutlined />;
    if (status === 'Reserved') return <ClockCircleOutlined />;
    return null;
  };

  const handleTableClick = (table) => {
    if (table.status === 'Available') {
      navigate(`/tables/${table._id}/order`);
    } else if (table.status === 'Occupied' && table.currentOrder) {
      navigate(`/orders/${table.currentOrder._id}`);
    } else {
      message.info(`Table is ${table.status.toLowerCase()}`);
    }
  };

  const filteredTables = tables.filter(table => {
    const statusMatch = filterStatus === 'all' || table.status === filterStatus;
    return statusMatch && table.isActive;
  });

  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              <AppstoreOutlined style={{ marginRight: '8px' }} />
              Tables Management
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
              Click on any available table to start taking orders
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchTables();
                fetchStats();
              }}
            >
              Refresh
            </Button>
            {user?.role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/masters/tables')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Manage Tables
              </Button>
            )}
          </Space>
        </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Tables"
              value={stats.totalTables || 0}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Available"
              value={stats.availableTables || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Occupied"
              value={stats.occupiedTables || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Occupancy Rate"
              value={stats.occupancyRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <span style={{ fontWeight: 500 }}>Filter by Status:</span>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
          >
            <Option value="all">All Status</Option>
            <Option value="Available">Available</Option>
            <Option value="Occupied">Occupied</Option>
            <Option value="Reserved">Reserved</Option>
          </Select>
        </Space>
      </Card>

      {/* Tables Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredTables.length === 0 ? (
        <Card>
          <Empty
            description="No tables found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {user?.role === 'admin' && (
              <Button
                type="primary"
                onClick={() => navigate('/masters/tables')}
              >
                Add New Table
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <Row gutter={[12, 12]}>
          {filteredTables.map(table => (
            <Col xs={12} sm={8} md={6} lg={3} key={table._id}>
              <Card
                hoverable
                onClick={() => handleTableClick(table)}
                style={{
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(table.status)}`,
                  background: table.status === 'Available'
                    ? 'linear-gradient(135deg, #f0fff4 0%, #e6f7ff 100%)'
                    : table.status === 'Occupied'
                    ? 'linear-gradient(135deg, #fff1f0 0%, #fff0f0 100%)'
                    : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
                bodyStyle={{ padding: '14px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px'
                }}>
                  <Badge
                    status={
                      table.status === 'Available' ? 'success' :
                      table.status === 'Occupied' ? 'error' :
                      table.status === 'Reserved' ? 'warning' : 'default'
                    }
                  />
                </div>

                {/* Table Icon/Number */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    background: getStatusColor(table.status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)'
                  }}>
                    {table.tableNumber}
                  </div>
                </div>

                {/* Table Name */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#262626'
                }}>
                  {table.tableName}
                </div>

                {/* Table Details */}
                <div style={{
                  background: 'white',
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#262626'
                  }}>
                    <UserOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                    {table.seatingCapacity} Seats
                  </div>
                </div>

                {/* Current Order Info - Simplified */}
                {table.status === 'Occupied' && table.currentOrder && (
                  <div style={{
                    background: '#fff2e8',
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    textAlign: 'center',
                    border: '1px solid #ffbb96'
                  }}>
                    {table.currentOrder.grandTotal && (
                      <div style={{ color: '#fa8c16', fontWeight: 600 }}>
                        <DollarOutlined /> ₹{table.currentOrder.grandTotal.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Hint */}
                <div style={{
                  marginTop: '8px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#8c8c8c'
                }}>
                  {table.status === 'Available' ? (
                    'Tap to order'
                  ) : table.status === 'Occupied' ? (
                    'View order'
                  ) : (
                    'Reserved'
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      </div>
    </Layout>
  );
};

export default TablesView;
