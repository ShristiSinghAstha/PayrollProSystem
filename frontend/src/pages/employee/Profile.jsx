import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, updateProfile } from '@/api/authApi';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    phone: user?.personalInfo?.phone || '',
    address: {
      street: user?.personalInfo?.address?.street || '',
      city: user?.personalInfo?.address?.city || '',
      state: user?.personalInfo?.address?.state || '',
      zipCode: user?.personalInfo?.address?.zipCode || ''
    }
  });

  const personal = user?.personalInfo || {};
  const employment = user?.employment || {};
  const bankDetails = user?.bankDetails || {};

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await updateProfile({
        personalInfo: {
          phone: editForm.phone,
          address: editForm.address
        }
      });
      toast.success('Profile updated successfully');
      setShowEditModal(false);
      window.location.reload(); // Reload to fetch updated user data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Your personal information</p>
        </div>
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card title="Personal Details">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium text-gray-900">
                {personal.firstName} {personal.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{personal.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium text-gray-900">{personal.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Birth</span>
              <span className="font-medium text-gray-900">{formatDate(personal.dateOfBirth)}</span>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="mt-4 w-full"
            onClick={() => setShowEditModal(true)}
          >
            Edit Contact Info
          </Button>
        </Card>

        {/* Employment */}
        <Card title="Employment">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Employee ID</span>
              <span className="font-medium text-gray-900">{user?.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-medium text-gray-900">{employment.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Designation</span>
              <span className="font-medium text-gray-900">{employment.designation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Joining</span>
              <span className="font-medium text-gray-900">{formatDate(employment.dateOfJoining)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-gray-900">{employment.status}</span>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card title="Bank Details">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Holder</span>
              <span className="font-medium text-gray-900">{bankDetails.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Number</span>
              <span className="font-medium text-gray-900">{bankDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IFSC Code</span>
              <span className="font-medium text-gray-900">{bankDetails.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Name</span>
              <span className="font-medium text-gray-900">{bankDetails.bankName}</span>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card title="Security">
          <p className="text-sm text-gray-600 mb-4">Manage your password and account security</p>
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </Button>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleChangePassword}>
              Update Password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Contact Information"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleUpdateProfile}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            placeholder="10-digit phone number"
          />
          <Input
            label="Street Address"
            value={editForm.address.street}
            onChange={(e) => setEditForm({ 
              ...editForm, 
              address: { ...editForm.address, street: e.target.value }
            })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={editForm.address.city}
              onChange={(e) => setEditForm({ 
                ...editForm, 
                address: { ...editForm.address, city: e.target.value }
              })}
            />
            <Input
              label="State"
              value={editForm.address.state}
              onChange={(e) => setEditForm({ 
                ...editForm, 
                address: { ...editForm.address, state: e.target.value }
              })}
            />
          </div>
          <Input
            label="ZIP Code"
            value={editForm.address.zipCode}
            onChange={(e) => setEditForm({ 
              ...editForm, 
              address: { ...editForm.address, zipCode: e.target.value }
            })}
            placeholder="6-digit PIN code"
          />
        </div>
      </Modal>
    </PageContainer>
  );
};

export default Profile;