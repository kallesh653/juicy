import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './components/auth/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';
import MainCodeMaster from './components/masters/MainCodeMaster';
import SubCodeMaster from './components/masters/SubCodeMaster';
import SupplierMaster from './components/masters/SupplierMaster';
import UserMaster from './components/masters/UserMaster';
import TakeOrder from './components/billing/TakeOrder';
import ViewBills from './components/billing/ViewBills';
import AddPurchase from './components/purchase/AddPurchase';
import ViewPurchases from './components/purchase/ViewPurchases';
import StockView from './components/stock/StockView';
import SalesReport from './components/reports/SalesReport';
import ItemwiseSales from './components/reports/ItemwiseSales';
import UserwiseSales from './components/reports/UserwiseSales';
import DailyCollection from './components/reports/DailyCollection';
import PurchaseSummary from './components/reports/PurchaseSummary';
import StockReport from './components/reports/StockReport';
import ProfitReport from './components/reports/ProfitReport';
import SupplierReport from './components/reports/SupplierReport';
import BusinessSettings from './components/settings/BusinessSettings';
import TablesView from './components/tables/TablesView';
import TableManagement from './components/tables/TableManagement';
import TakeTableOrder from './components/tables/TakeTableOrder';
import OrderView from './components/orders/OrderView';
import ParcelOrder from './components/billing/ParcelOrder';
import CustomerMenu from './components/customer/CustomerMenu';
import OrderConfirmation from './components/customer/OrderConfirmation';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60,
            height: 60,
            border: '4px solid #667eea',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: 16, color: '#666' }}>Loading...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public customer routes - NO authentication required */}
      <Route path="/menu/:tableId" element={<CustomerMenu />} />
      <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
          </ProtectedRoute>
        }
      />

      {/* Masters - Admin Only */}
      <Route
        path="/masters/maincodes"
        element={
          <ProtectedRoute adminOnly>
            <MainCodeMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/subcodes"
        element={
          <ProtectedRoute adminOnly>
            <SubCodeMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/suppliers"
        element={
          <ProtectedRoute adminOnly>
            <SupplierMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/users"
        element={
          <ProtectedRoute adminOnly>
            <UserMaster />
          </ProtectedRoute>
        }
      />

      {/* Tables */}
      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <TablesView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/tables"
        element={
          <ProtectedRoute adminOnly>
            <TableManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables/:tableId/order"
        element={
          <ProtectedRoute>
            <TakeTableOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderView />
          </ProtectedRoute>
        }
      />

      {/* Billing */}
      <Route
        path="/billing/take-order"
        element={
          <ProtectedRoute>
            <TakeOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/parcel-order"
        element={
          <ProtectedRoute>
            <ParcelOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/view-bills"
        element={
          <ProtectedRoute>
            <ViewBills />
          </ProtectedRoute>
        }
      />

      {/* Purchase - Admin Only */}
      <Route
        path="/purchase/add"
        element={
          <ProtectedRoute adminOnly>
            <AddPurchase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase/view"
        element={
          <ProtectedRoute adminOnly>
            <ViewPurchases />
          </ProtectedRoute>
        }
      />

      {/* Stock - Admin Only */}
      <Route
        path="/stock"
        element={
          <ProtectedRoute adminOnly>
            <StockView />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports/sales"
        element={
          <ProtectedRoute>
            <SalesReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/itemwise"
        element={
          <ProtectedRoute>
            <ItemwiseSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/userwise"
        element={
          <ProtectedRoute adminOnly>
            <UserwiseSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/daily-collection"
        element={
          <ProtectedRoute>
            <DailyCollection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/purchases"
        element={
          <ProtectedRoute adminOnly>
            <PurchaseSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/stock"
        element={
          <ProtectedRoute adminOnly>
            <StockReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/profit"
        element={
          <ProtectedRoute adminOnly>
            <ProfitReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/suppliers"
        element={
          <ProtectedRoute adminOnly>
            <SupplierReport />
          </ProtectedRoute>
        }
      />

      {/* Settings - Admin Only */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <BusinessSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route - redirect to home */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Navigate to="/" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
