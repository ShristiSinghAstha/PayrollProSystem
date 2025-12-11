import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/formatters';

const Profile = () => {
  const { user, logout } = useAuth();

  const personal = user?.personalInfo || {};
  const employment = user?.employment || {};

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
          </div>
        </Card>

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
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Profile;
