import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import EmployeeList from '@/pages/admin/EmployeeList';
import EmployeeDetail from '@/pages/admin/EmployeeDetail';
import EmployeeForm from '@/pages/admin/EmployeeForm';
import PayrollList from '@/pages/admin/PayrollList';
import PayrollDetail from '@/pages/admin/PayrollDetail';
import EmployeeDashboard from '@/pages/employee/Dashboard';
import Payslips from '@/pages/employee/Payslips';
import Notifications from '@/pages/employee/Notifications';
import Reports from '@/pages/admin/Reports';
import Profile from '@/pages/employee/Profile';
import LeaveApprovals from '@/pages/admin/LeaveApprovals';
import MyLeaves from '@/pages/employee/MyLeaves';
import MyAttendance from '@/pages/employee/MyAttendance';
import TaxDeclarations from '@/pages/employee/TaxDeclarations';
// import MyReviews from '@/pages/employee/MyReviews';
import AdminSettings from '@/pages/admin/Settings';
// import PerformanceReviews from '@/pages/admin/PerformanceReviews';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

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
        <Route path="employees/:id/view" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="payroll" element={<PayrollList />} />
        <Route path="payroll/:month" element={<PayrollDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="leaves" element={<LeaveApprovals />} />
        {/* <Route path="reviews" element={<PerformanceReviews />} /> */}
        <Route path="settings" element={<AdminSettings />} />
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
        <Route path="leaves" element={<MyLeaves />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="tax-declarations" element={<TaxDeclarations />} />
        {/* <Route path="reviews" element={<MyReviews />} /> */}
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