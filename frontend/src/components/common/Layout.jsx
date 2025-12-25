import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge, Tag, Space, Drawer } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShopOutlined,
  AppstoreOutlined,
  InboxOutlined,
  TeamOutlined,
  SettingOutlined,
  StockOutlined,
  CrownOutlined,
  TableOutlined,
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileDrawerOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const adminMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'masters',
      icon: <AppstoreOutlined />,
      label: 'Masters',
      children: [
        { key: '/masters/maincodes', label: 'Main Codes' },
        { key: '/masters/subcodes', label: 'Sub Codes' },
        { key: '/masters/suppliers', label: 'Suppliers' },
        { key: '/masters/users', label: 'Users' },
        { key: '/masters/tables', label: 'Manage Tables' },
      ],
    },
    {
      key: '/tables',
      icon: <TableOutlined />,
      label: 'Tables',
    },
    {
      key: 'billing',
      icon: <ShoppingCartOutlined />,
      label: 'Billing',
      children: [
        { key: '/billing/take-order', label: 'Dine-In Order' },
        { key: '/billing/parcel-order', label: 'Parcel Order' },
      ],
    },
    {
      key: '/billing/view-bills',
      icon: <FileTextOutlined />,
      label: 'View Bills',
    },
    {
      key: 'purchase',
      icon: <InboxOutlined />,
      label: 'Purchase',
      children: [
        { key: '/purchase/add', label: 'Add Purchase' },
        { key: '/purchase/view', label: 'View Purchases' },
      ],
    },
    {
      key: '/stock',
      icon: <StockOutlined />,
      label: 'Stock Management',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      children: [
        { key: '/reports/sales', label: 'Sales Report' },
        { key: '/reports/itemwise', label: 'Item-wise Sales' },
        { key: '/reports/userwise', label: 'User-wise Sales' },
        { key: '/reports/daily-collection', label: 'Daily Collection' },
        { key: '/reports/purchases', label: 'Purchase Summary' },
        { key: '/reports/stock', label: 'Stock Report' },
        { key: '/reports/profit', label: 'Profit Report' },
        { key: '/reports/suppliers', label: 'Supplier Report' },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const userMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/tables',
      icon: <TableOutlined />,
      label: 'Tables',
    },
    {
      key: 'billing',
      icon: <ShoppingCartOutlined />,
      label: 'Billing',
      children: [
        { key: '/billing/take-order', label: 'Dine-In Order' },
        { key: '/billing/parcel-order', label: 'Parcel Order' },
      ],
    },
    {
      key: '/billing/view-bills',
      icon: <FileTextOutlined />,
      label: 'My Bills',
    },
    {
      key: '/reports/daily-collection',
      icon: <BarChartOutlined />,
      label: 'Daily Collection',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {user?.username}
            </div>
          </div>
        ),
        disabled: true
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
        label: <span style={{ color: '#ff4d4f', fontWeight: 600 }}>Logout</span>,
        onClick: logout,
      },
    ],
  };

  // Sidebar Content Component (reusable for both Sider and Drawer)
  const SidebarContent = () => (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '3px solid #5a67d8',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <img
          src="/logo.jpeg"
          alt="Logo"
          style={{
            width: collapsed && !isMobile ? 28 : 36,
            height: collapsed && !isMobile ? 28 : 36,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            position: 'relative',
            zIndex: 1,
            borderRadius: 6,
            objectFit: 'cover'
          }}
        />
        {(!collapsed || isMobile) && (
          <span style={{
            marginLeft: 12,
            fontSize: 20,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1
          }}>
            Juicy
          </span>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, height: 'calc(100% - 64px)', overflowY: 'auto' }}
      />
    </>
  );

  return (
    <>
      <AntLayout style={{ minHeight: '100vh' }}>
        {/* Desktop Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            theme="light"
            style={{
              boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
              borderRight: '1px solid #f0f0f0',
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <SidebarContent />
          </Sider>
        )}

        {/* Mobile Drawer - Only on Mobile */}
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen && isMobile}
          closable={false}
          width={280}
          bodyStyle={{ padding: 0 }}
          styles={{ body: { padding: 0 } }}
        >
          <SidebarContent />
        </Drawer>

        <AntLayout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), transition: 'all 0.2s' }}>
          <Header
            style={{
              padding: isMobile ? '0 12px' : '0 24px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.12)',
              borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
              height: 64,
              position: 'sticky',
              top: 0,
              zIndex: 999
            }}
          >
            <Button
              type="text"
              icon={isMobile ? (
                mobileDrawerOpen ? <CloseOutlined /> : <MenuOutlined />
              ) : (
                collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
              )}
              onClick={() => isMobile ? setMobileDrawerOpen(!mobileDrawerOpen) : setCollapsed(!collapsed)}
              style={{
                fontSize: isMobile ? 20 : 18,
                width: isMobile ? 48 : 64,
                height: 64,
                color: '#667eea',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Mobile: Show logo in header */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <img src="/logo.jpeg" alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                <span style={{ marginLeft: 8, fontSize: 18, fontWeight: 700, color: '#667eea' }}>Juicy</span>
              </div>
            )}

            <Space size={isMobile ? "small" : "large"} style={{ display: 'flex', alignItems: 'center' }}>
              {!isMobile && (
                <Tag
                  icon={user?.role === 'admin' ? <CrownOutlined /> : <TeamOutlined />}
                  color={user?.role === 'admin' ? 'gold' : 'green'}
                  style={{
                    fontSize: 14,
                    padding: '6px 16px',
                    fontWeight: 600,
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: user?.role === 'admin'
                      ? '0 2px 8px rgba(250, 173, 20, 0.3)'
                      : '0 2px 8px rgba(82, 196, 26, 0.3)',
                    background: user?.role === 'admin'
                      ? 'linear-gradient(135deg, #ffd666 0%, #faad14 100%)'
                      : 'linear-gradient(135deg, #95de64 0%, #52c41a 100%)',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Cashier'}
                </Tag>
              )}

              <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                <Avatar
                  size={isMobile ? 38 : 48}
                  style={{
                    backgroundColor: 'transparent',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    border: '3px solid white',
                    transition: 'all 0.3s ease'
                  }}
                  icon={<UserOutlined style={{ fontSize: isMobile ? 18 : 22 }} />}
                />
              </Dropdown>
            </Space>
          </Header>

          <Content
            style={{
              margin: isMobile ? '12px' : '24px',
              padding: isMobile ? 12 : 24,
              background: '#f0f2f5',
              minHeight: 280,
            }}
          >
            {children}
          </Content>
        </AntLayout>
      </AntLayout>

      {/* Mobile-specific global styles */}
      <style>{`
        @media (max-width: 768px) {
          /* Table optimizations */
          .ant-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .ant-table {
            min-width: 600px;
            font-size: 13px;
          }
          .ant-table-thead > tr > th {
            padding: 8px 4px;
            font-size: 12px;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 4px;
          }

          /* Card optimizations */
          .ant-card {
            margin-bottom: 12px;
          }
          .ant-card-body {
            padding: 12px;
          }
          .ant-card-head {
            padding: 0 12px;
            min-height: 40px;
          }

          /* Form optimizations */
          .ant-form-item {
            margin-bottom: 12px;
          }
          .ant-row {
            gap: 0 !important;
          }

          /* Button optimizations */
          .ant-btn {
            height: 40px;
            font-size: 14px;
            padding: 0 12px;
          }
          .ant-btn-sm {
            height: 32px;
            padding: 0 8px;
            font-size: 12px;
          }

          /* Input optimizations */
          .ant-input, .ant-select-selector, .ant-picker {
            height: 40px !important;
            font-size: 14px;
          }
          .ant-input-number {
            width: 100% !important;
          }
          .ant-select-selection-item {
            line-height: 38px !important;
          }

          /* Modal optimizations */
          .ant-modal {
            max-width: calc(100vw - 24px);
            margin: 12px auto;
          }
          .ant-modal-body {
            padding: 12px;
          }
          .ant-modal-header {
            padding: 12px;
          }
          .ant-modal-footer {
            padding: 12px;
          }

          /* Statistic optimizations */
          .ant-statistic-title {
            font-size: 12px;
          }
          .ant-statistic-content {
            font-size: 18px;
          }

          /* Col responsiveness */
          .ant-col {
            padding-left: 6px !important;
            padding-right: 6px !important;
          }

          /* Order page specific */
          h1 {
            font-size: 20px !important;
            margin-bottom: 12px !important;
          }
          h2 {
            font-size: 18px !important;
          }
          h3 {
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          /* Small mobile optimizations */
          .ant-space {
            gap: 6px !important;
          }
          .ant-btn-lg {
            height: 44px;
            font-size: 15px;
            padding: 0 16px;
          }
          .ant-table {
            font-size: 12px;
          }
          .ant-input-number {
            font-size: 13px;
          }
        }

        /* Touch-friendly buttons */
        @media (hover: none) and (pointer: coarse) {
          .ant-btn {
            min-height: 44px;
          }
          .ant-input, .ant-select-selector {
            min-height: 44px;
          }
          .ant-table-tbody > tr > td .ant-btn {
            min-height: 36px;
            padding: 4px 8px;
          }
        }
      `}</style>
    </>
  );
};

export default Layout;
