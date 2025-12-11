import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { formatDate } from '@/utils/formatters';
import { DEPARTMENTS } from '@/utils/constants';

const EmployeeCard = ({ employee, onView, onEdit, onDeactivate }) => {
  if (!employee) return null;

  const { personalInfo = {}, employment = {}, salaryStructure = {} } = employee;

  return (
    <Card padding="sm" hover className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
          {personalInfo.firstName?.[0]}
          {personalInfo.lastName?.[0]}
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">{employee.employeeId}</p>
          <h4 className="text-lg font-semibold text-gray-900">
            {personalInfo.firstName} {personalInfo.lastName}
          </h4>
          <p className="text-sm text-gray-600">
            {employment.designation} • {employment.department || DEPARTMENTS[0]}
          </p>
          <p className="text-xs text-gray-500">Joined {formatDate(employment.dateOfJoining)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={employment.status === 'Active' ? 'success' : 'warning'}>
          {employment.status}
        </Badge>
        <div className="text-right">
          <p className="text-xs text-gray-500">Net / month</p>
          <p className="text-lg font-semibold text-gray-900">₹{salaryStructure.basicSalary}</p>
        </div>
        {onView && (
          <button
            onClick={() => onView(employee)}
            className="px-3 py-2 text-sm text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
          >
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Edit
          </button>
        )}
        {onDeactivate && (
          <button
            onClick={() => onDeactivate(employee)}
            className="px-3 py-2 text-sm text-error-600 bg-error-50 rounded-lg hover:bg-error-100"
          >
            Deactivate
          </button>
        )}
      </div>
    </Card>
  );
};

export default EmployeeCard;
