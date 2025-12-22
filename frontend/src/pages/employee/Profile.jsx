import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, updateProfile } from '@/api/authApi';
import { formatDate } from '@/utils/formatters';
import { message } from 'antd';
import { showConfirmation } from '@/utils/confirmations';
import { User, Briefcase, CreditCard, Lock, Edit2, X } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
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
      message.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      message.error('Password must be at least 6 characters');
      return;
    }

    const confirmed = await showConfirmation({
      title: 'Change Password?',
      text: 'Are you sure you want to change your password?',
      icon: 'question',
      confirmButtonText: 'Yes, change it',
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      message.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to change password');
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
      message.success('Profile updated successfully');
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your personal information</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button onClick={() => setShowEditModal(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="mt-1 text-foreground">{personal.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="mt-1 text-foreground">{personal.lastName}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-foreground">{personal.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="mt-1 text-foreground">{personal.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="mt-1 text-foreground">{formatDate(personal.dateOfBirth)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="mt-1 text-foreground">
                {personal.address?.street}, {personal.address?.city},{' '}
                {personal.address?.state} {personal.address?.zipCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Information
            </CardTitle>
            <CardDescription>Your work details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
              <p className="mt-1 text-foreground font-mono">{user?.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="mt-1 text-foreground">{employment.department}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Position</label>
              <p className="mt-1 text-foreground">{employment.position}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Join Date</label>
              <p className="mt-1 text-foreground">{formatDate(employment.dateOfJoining)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="mt-1">
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${employment.status === 'Active'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                  {employment.status}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
            <CardDescription>Your payment information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
              <p className="mt-1 text-foreground">{bankDetails.bankName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Number</label>
              <p className="mt-1 text-foreground font-mono">****{bankDetails.accountNumber?.slice(-4)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
              <p className="mt-1 text-foreground font-mono">{bankDetails.ifscCode}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPasswordModal(false)}
        >
          <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Change Password</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowPasswordModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <input
                  type="password"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input
                  type="password"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Edit Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Street</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={editForm.address.street}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={editForm.address.city}
                    onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={editForm.address.state}
                    onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={editForm.address.zipCode}
                  onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, zipCode: e.target.value } })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default Profile;
