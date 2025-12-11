import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import EmployeeList from '@/pages/admin/EmployeeList';
import EmployeeForm from '@/pages/admin/EmployeeForm';
import PayrollList from '@/pages/admin/PayrollList';
import PayrollDetail from '@/pages/admin/PayrollDetail';
import EmployeeDashboard from '@/pages/employee/Dashboard';
import Payslips from '@/pages/employee/Payslips';
import Notifications from '@/pages/employee/Notifications';
import Reports from '@/pages/admin/Reports';
import Profile from '@/pages/employee/Profile';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/dashboard'} replace />
          ) : (
            <Login />
          )
        } 
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeForm />} />
        <Route path="payroll" element={<PayrollList />} />
        <Route path="payroll/:month" element={<PayrollDetail />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Employee Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="payslips" element={<Payslips />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          <Navigate to={
            isAuthenticated 
              ? (isAdmin ? '/admin/dashboard' : '/employee/dashboard')
              : '/login'
          } replace />
        } 
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;