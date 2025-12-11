import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { DEPARTMENTS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

const schema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Valid email required'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter 10-digit phone'),
    dateOfBirth: z.string(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }),
  }),
  employment: z.object({
    department: z.string().min(1, 'Department required'),
    designation: z.string().min(2, 'Designation required'),
    dateOfJoining: z.string(),
    status: z.string().optional(),
  }),
  bankDetails: z.object({
    accountNumber: z.string().min(9, 'Account number required'),
    accountHolderName: z.string().min(2, 'Account holder required'),
    ifscCode: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Invalid IFSC'),
    bankName: z.string().min(2, 'Bank name required'),
    branch: z.string().optional(),
  }),
  salaryStructure: z.object({
    basicSalary: z.coerce.number().min(0, 'Basic required'),
    hra: z.coerce.number().min(0).optional(),
    da: z.coerce.number().min(0).optional(),
    specialAllowance: z.coerce.number().min(0).optional(),
    otherAllowances: z.coerce.number().min(0).optional(),
    pfPercentage: z.coerce.number().min(0),
    professionalTax: z.coerce.number().min(0),
    esiPercentage: z.coerce.number().min(0),
  }),
  password: z.string().optional(), // only for create
});

const defaultFormValues = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
  },
  employment: {
    department: DEPARTMENTS[0],
    designation: '',
    dateOfJoining: '',
    status: 'Active',
  },
  bankDetails: {
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankName: '',
    branch: '',
  },
  salaryStructure: {
    basicSalary: 0,
    hra: 0,
    da: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    pfPercentage: 12,
    professionalTax: 200,
    esiPercentage: 0.75,
  },
  password: '',
};

const EmployeeForm = ({ defaultValues = defaultFormValues, onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchSalary = watch('salaryStructure');
  const earnings = useMemo(() => {
    const { basicSalary = 0, hra = 0, da = 0, specialAllowance = 0, otherAllowances = 0 } = watchSalary || {};
    return Number(basicSalary) + Number(hra) + Number(da) + Number(specialAllowance) + Number(otherAllowances);
  }, [watchSalary]);

  const deductions = useMemo(() => {
    const { basicSalary = 0, pfPercentage = 0, professionalTax = 0, esiPercentage = 0 } = watchSalary || {};
    const pf = (Number(pfPercentage) / 100) * Number(basicSalary);
    const esi = (Number(esiPercentage) / 100) * Number(basicSalary);
    return pf + Number(professionalTax) + esi;
  }, [watchSalary]);

  const net = Math.max(earnings - deductions, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" required {...register('personalInfo.firstName')} error={errors.personalInfo?.firstName?.message} />
          <Input label="Last Name" required {...register('personalInfo.lastName')} error={errors.personalInfo?.lastName?.message} />
          <Input label="Email" type="email" required {...register('personalInfo.email')} error={errors.personalInfo?.email?.message} />
          <Input label="Phone" required {...register('personalInfo.phone')} error={errors.personalInfo?.phone?.message} />
          <Input label="Date of Birth" type="date" required {...register('personalInfo.dateOfBirth')} error={errors.personalInfo?.dateOfBirth?.message} />
          <Input label="Street" {...register('personalInfo.address.street')} />
          <Input label="City" {...register('personalInfo.address.city')} />
          <Input label="State" {...register('personalInfo.address.state')} />
          <Input label="PIN Code" {...register('personalInfo.address.zipCode')} />
          <Input label="Country" {...register('personalInfo.address.country')} />
        </div>
      </Card>

      <Card title="Employment Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Department"
            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
            required
            {...register('employment.department')}
            error={errors.employment?.department?.message}
          />
          <Input label="Designation" required {...register('employment.designation')} error={errors.employment?.designation?.message} />
          <Input label="Date of Joining" type="date" required {...register('employment.dateOfJoining')} error={errors.employment?.dateOfJoining?.message} />
          <Select
            label="Status"
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
              { label: 'Terminated', value: 'Terminated' },
              { label: 'Resigned', value: 'Resigned' },
            ]}
            {...register('employment.status')}
            error={errors.employment?.status?.message}
          />
        </div>
      </Card>

      <Card title="Bank Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Account Number" required {...register('bankDetails.accountNumber')} error={errors.bankDetails?.accountNumber?.message} />
          <Input label="Account Holder Name" required {...register('bankDetails.accountHolderName')} error={errors.bankDetails?.accountHolderName?.message} />
          <Input label="IFSC Code" required {...register('bankDetails.ifscCode')} error={errors.bankDetails?.ifscCode?.message} />
          <Input label="Bank Name" required {...register('bankDetails.bankName')} error={errors.bankDetails?.bankName?.message} />
          <Input label="Branch" {...register('bankDetails.branch')} />
        </div>
      </Card>

      <Card title="Salary Structure">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Basic Salary" type="number" required {...register('salaryStructure.basicSalary', { valueAsNumber: true })} error={errors.salaryStructure?.basicSalary?.message} />
          <Input label="HRA" type="number" {...register('salaryStructure.hra', { valueAsNumber: true })} error={errors.salaryStructure?.hra?.message} />
          <Input label="DA" type="number" {...register('salaryStructure.da', { valueAsNumber: true })} error={errors.salaryStructure?.da?.message} />
          <Input label="Special Allowance" type="number" {...register('salaryStructure.specialAllowance', { valueAsNumber: true })} error={errors.salaryStructure?.specialAllowance?.message} />
          <Input label="Other Allowances" type="number" {...register('salaryStructure.otherAllowances', { valueAsNumber: true })} error={errors.salaryStructure?.otherAllowances?.message} />
          <Input label="PF % (default 12%)" type="number" {...register('salaryStructure.pfPercentage', { valueAsNumber: true })} error={errors.salaryStructure?.pfPercentage?.message} />
          <Input label="Professional Tax" type="number" {...register('salaryStructure.professionalTax', { valueAsNumber: true })} error={errors.salaryStructure?.professionalTax?.message} />
          <Input label="ESI % (default 0.75%)" type="number" {...register('salaryStructure.esiPercentage', { valueAsNumber: true })} error={errors.salaryStructure?.esiPercentage?.message} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm" className="bg-gray-50">
            <p className="text-xs text-gray-500">Gross Earnings</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(earnings)}</p>
          </Card>
          <Card padding="sm" className="bg-gray-50">
            <p className="text-xs text-gray-500">Deductions</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(deductions)}</p>
          </Card>
          <Card padding="sm" className="bg-success-50 border-success-200">
            <p className="text-xs text-success-600">Net Salary (per month)</p>
            <p className="text-2xl font-bold text-success-700">{formatCurrency(net)}</p>
          </Card>
        </div>
      </Card>

      {/* Password (only on create) */}
      {!defaultValues?._id && (
        <Card title="Portal Access">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Set an initial password"
              {...register('password')}
              error={errors.password?.message}
              required
            />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" variant="primary" loading={loading}>
          {loading ? 'Saving...' : 'Save Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
