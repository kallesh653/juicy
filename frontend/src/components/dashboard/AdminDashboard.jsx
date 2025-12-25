import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button, Badge, Spin } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  UserOutlined,
  ArrowUpOutlined,
  FileTextOutlined,
  PlusOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  SettingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../common/Layout';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentBills, setRecentBills] = useState([]);
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchTables();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [todaySummary, bills] = await Promise.all([
        api.get('/bills/summary/today'),
        api.get('/bills?limit=5')
      ]);

      setStats(todaySummary.data.summary);
      setRecentBills(bills.data.bills || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      setTablesLoading(true);
      const response = await api.get('/tables');
      setTables(response.data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setTablesLoading(false);
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

  const handleTableClick = (table) => {
    if (table.status === 'Available') {
      navigate(`/tables/${table._id}/order`);
    } else if (table.status === 'Occupied' && table.currentOrder) {
      navigate(`/orders/${table.currentOrder._id}`);
    }
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.totalSales || 0,
      prefix: '₹',
      icon: <DollarOutlined />,
      color: '#667eea'
    },
    {
      title: "Today's Bills",
      value: stats.totalBills || 0,
      icon: <FileTextOutlined />,
      color: '#f093fb'
    },
    {
      title: 'Cash Collection',
      value: stats.cash || 0,
      prefix: '₹',
      icon: <DollarOutlined />,
      color: '#4facfe'
    },
    {
      title: 'UPI Collection',
      value: stats.upi || 0,
      prefix: '₹',
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    }
  ];

  const columns = [
    { title: 'Bill No', dataIndex: 'billNo', key: 'billNo' },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (amount) => `₹${amount?.toFixed(2)}`
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (mode) => <Tag color="blue">{mode}</Tag>
    },
    {
      title: 'Time',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date) => new Date(date).toLocaleTimeString()
    }
  ];

  return (
    <Layout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1 style={{ marginBottom: 8, fontSize: 32, fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Admin Dashboard
          </h1>
          <p style={{ marginBottom: 24, color: '#999', fontSize: 15 }}>
            Manage your restaurant operations in real-time
          </p>
        </div>

        {/* Table Status Section - FIRST */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Table Status</h2>
              <Button type="link" onClick={() => navigate('/tables')}>
                View All Tables
              </Button>
            </div>
          </Col>
          {tablesLoading ? (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            </Col>
          ) : tables.filter(t => t.isActive).slice(0, 16).map(table => (
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
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
                bodyStyle={{ padding: '12px', textAlign: 'center' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px'
                }}>
                  <Badge
                    status={
                      table.status === 'Available' ? 'success' :
                      table.status === 'Occupied' ? 'error' :
                      table.status === 'Reserved' ? 'warning' : 'default'
                    }
                  />
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  margin: '0 auto 8px',
                  borderRadius: '50%',
                  background: getStatusColor(table.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {table.tableNumber}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#262626',
                  marginBottom: '4px'
                }}>
                  {table.tableName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#8c8c8c'
                }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {table.seatingCapacity}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {statCards.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="stat-card fade-in"
                style={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                  border: 'none',
                  color: 'white'
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{stat.icon}</div>
                <Statistic
                  title={<span style={{ color: 'white' }}>{stat.title}</span>}
                  value={stat.value}
                  prefix={stat.prefix}
                  valueStyle={{ color: 'white', fontSize: 32, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Access Cards */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600 }}>Quick Access</h2>
          </Col>
          <Col xs={24} sm={12} md={8} key="take-order">
            <Card
              hoverable
              onClick={() => navigate('/billing/take-order')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <FileTextOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <h3 style={{ color: 'white', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>Take Order</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>Create new billing order</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} key="add-purchase">
            <Card
              hoverable
              onClick={() => navigate('/purchase/add')}
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(240, 147, 251, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.3)';
              }}
            >
              <PlusOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <h3 style={{ color: 'white', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>Add Purchase</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>Add inventory stock</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} key="view-reports">
            <Card
              hoverable
              onClick={() => navigate('/reports/sales')}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 172, 254, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.3)';
              }}
            >
              <BarChartOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <h3 style={{ color: 'white', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>View Reports</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>Sales data & analytics</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} key="manage-items">
            <Card
              hoverable
              onClick={() => navigate('/masters/subcodes')}
              style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(250, 112, 154, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 112, 154, 0.3)';
              }}
            >
              <ShoppingCartOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <h3 style={{ color: 'white', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>Manage Items</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>Stock control & items</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} key="manage-tables">
            <Card
              hoverable
              onClick={() => navigate('/tables')}
              style={{
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(168, 237, 234, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 237, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 237, 234, 0.3)';
              }}
            >
              <AppstoreOutlined style={{ fontSize: 48, color: '#333', marginBottom: 12 }} />
              <h3 style={{ color: '#333', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>Manage Tables</h3>
              <p style={{ color: '#555', margin: 0, fontSize: 14 }}>Table setup & orders</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} key="settings">
            <Card
              hoverable
              onClick={() => navigate('/settings')}
              style={{
                background: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(67, 67, 67, 0.3)'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(67, 67, 67, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 67, 67, 0.3)';
              }}
            >
              <SettingOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <h3 style={{ color: 'white', margin: '8px 0', fontSize: 18, fontWeight: 600 }}>Settings</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>Configure system</p>
            </Card>
          </Col>
        </Row>

        {/* Recent Bills */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title="Recent Bills"
              extra={
                <Button type="link" onClick={() => navigate('/billing/view-bills')}>
                  View All
                </Button>
              }
            >
              <Table
                dataSource={recentBills}
                columns={columns}
                rowKey="_id"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Dashboard mobile styles */}
      <style>{`
        .admin-dashboard {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card {
          transition: all 0.3s ease;
          border-radius: 12px !important;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3) !important;
        }

        @media (max-width: 768px) {
          .dashboard-header h1 {
            font-size: 24px !important;
          }

          .dashboard-header p {
            font-size: 13px !important;
          }

          /* Table cards mobile */
          .ant-col-xs-12 .ant-card {
            min-height: 110px;
          }

          .ant-col-xs-12 .ant-card-body {
            padding: 10px !important;
          }

          /* Table number circle smaller on mobile */
          .ant-col-xs-12 .ant-card-body > div:nth-child(2) {
            width: 42px !important;
            height: 42px !important;
            font-size: 16px !important;
            margin: 0 auto 6px !important;
          }

          /* Table name and capacity smaller */
          .ant-col-xs-12 .ant-card-body > div:nth-child(3) {
            font-size: 12px !important;
          }

          .ant-col-xs-12 .ant-card-body > div:nth-child(4) {
            font-size: 11px !important;
          }

          /* Stat cards mobile */
          .stat-card .ant-statistic-title {
            font-size: 12px !important;
          }

          .stat-card .ant-statistic-content {
            font-size: 22px !important;
          }

          .stat-card > div:first-child {
            font-size: 28px !important;
            margin-bottom: 6px !important;
          }

          /* Quick access cards mobile */
          .ant-col-xs-24 .ant-card-hoverable {
            margin-bottom: 12px;
          }

          .ant-col-xs-24 .ant-card-hoverable .ant-card-body {
            padding: 18px !important;
          }

          .ant-col-xs-24 .ant-card-hoverable .anticon {
            font-size: 36px !important;
          }

          .ant-col-xs-24 .ant-card-hoverable h3 {
            font-size: 16px !important;
          }

          .ant-col-xs-24 .ant-card-hoverable p {
            font-size: 13px !important;
          }

          /* Recent bills table mobile */
          .ant-table-small {
            font-size: 13px;
          }

          .ant-table-small .ant-table-thead > tr > th {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }

          .ant-table-small .ant-table-tbody > tr > td {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }

          /* Section headers */
          h2 {
            font-size: 18px !important;
          }

          /* View all buttons */
          .ant-btn-link {
            font-size: 13px !important;
            padding: 0 !important;
          }

          /* Badge positioning on table cards */
          .ant-badge-status {
            line-height: 1;
          }

          /* Touch targets for clickable cards */
          .ant-card-hoverable {
            min-height: 44px;
            cursor: pointer;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
          }
        }

        @media (max-width: 480px) {
          /* Extra small devices */
          .dashboard-header h1 {
            font-size: 22px !important;
          }

          .stat-card .ant-statistic-content {
            font-size: 20px !important;
          }

          .stat-card > div:first-child {
            font-size: 24px !important;
          }
        }

        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .ant-card-hoverable {
            min-height: 48px;
          }

          .ant-btn {
            min-height: 44px !important;
          }
        }

        /* Smooth transitions for all cards */
        .ant-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ant-card-hoverable:active {
          transform: scale(0.98);
        }
      `}</style>
    </Layout>
  );
};

export default AdminDashboard;
