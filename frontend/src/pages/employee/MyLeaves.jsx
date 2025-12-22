import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CheckCircle, Clock, XCircle, Trash2, X, AlertCircle } from "lucide-react";
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { applyLeave, getMyLeaves, deleteLeave } from '@/api/leaveApi';
import { formatDate } from '@/utils/formatters';

const MyLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: 'Casual',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await getMyLeaves(new Date().getFullYear());
            setLeaves(response.data.data.leaves);
            setBalance(response.data.data.balance);
        } catch (error) {
            setErrorMessage('Failed to fetch leave data');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();

        if (!formData.startDate || !formData.endDate) {
            setErrorMessage('Please select start and end dates');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!formData.reason.trim()) {
            setErrorMessage('Please provide a reason for leave');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            setApplying(true);
            await applyLeave({
                leaveType: formData.leaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason
            });
            setSuccessMessage('Leave application submitted successfully!');
            setShowApplyModal(false);
            setFormData({
                leaveType: 'Casual',
                startDate: '',
                endDate: '',
                reason: ''
            });
            fetchLeaves();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to apply for leave');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setApplying(false);
        }
    };

    const handleDeleteLeave = async (leaveId) => {
        try {
            await deleteLeave(leaveId);
            setSuccessMessage('Leave application deleted successfully');
            setDeleteConfirm(null);
            fetchLeaves();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to delete leave');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Pending': 'inline-flex items-center rounded-md border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700',
            'Approved': 'inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700',
            'Rejected': 'inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700'
        };
        return badges[status] || 'inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700';
    };

    const getLeaveTypeBadge = (type) => {
        const badges = {
            'Casual': 'inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700',
            'Sick': 'inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700',
            'Earned': 'inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700',
            'LOP': 'inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700'
        };
        return badges[type] || 'inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700';
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Leaves</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Manage your leave applications and balance</p>
                    </div>
                    <Button size="lg" className="gap-2" onClick={() => setShowApplyModal(true)}>
                        <Plus className="h-4 w-4" />
                        Apply for Leave
                    </Button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-700">{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            )}

            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {balance && Object.entries(balance).map(([type, data]) => (
                    <Card key={type} className="border">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">{type}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-semibold text-foreground">{data.remaining || data.allocated || 0}</p>
                                    {data.allocated && <p className="text-sm text-muted-foreground">/ {data.allocated} days</p>}
                                </div>
                                {data.allocated && (
                                    <>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-700 rounded-full transition-all"
                                                style={{ width: `${((data.remaining || 0) / data.allocated) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{data.used} used</p>
                                    </>
                                )}
                                {!data.allocated && (
                                    <p className="text-xs text-muted-foreground">{data.used || 0} used</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Leave Applications Table */}
            <Card className="border">
                <CardHeader>
                    <CardTitle>Leave Applications</CardTitle>
                    <CardDescription>View and manage your leave applications</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <span className={getLeaveTypeBadge(leave.leaveType)}>
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm text-gray-900">{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <Calendar className="h-3 w-3 inline mr-1" />
                                                    {leave.totalDays} {leave.totalDays > 1 ? 'days' : 'day'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 max-w-xs">
                                            <p className="text-sm text-gray-600 truncate">{leave.reason}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={getStatusBadge(leave.status)}>
                                                {leave.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                                                {leave.status === 'Approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {leave.status === 'Rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-gray-600">{dayjs(leave.createdAt).format('DD MMM YYYY')}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {leave.status === 'Pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteConfirm(leave)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {leaves.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No leave applications yet</p>
                                <Button className="mt-4 gap-2" onClick={() => setShowApplyModal(true)}>
                                    <Plus className="h-4 w-4" />
                                    Apply for Your First Leave
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowApplyModal(false)}>
                    <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Apply for Leave</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowApplyModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>Submit a new leave application</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <form onSubmit={handleApplyLeave} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Leave Type *</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={formData.leaveType}
                                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    >
                                        <option value="Casual">Casual</option>
                                        <option value="Sick">Sick</option>
                                        <option value="Earned">Earned</option>
                                        <option value="LOP">LOP (Loss of Pay)</option>
                                    </select>
                                </div>
                                <div class Name="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Start Date *</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">End Date *</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border rounded-md"
                                            value={formData.endDate}
                                            min={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Reason *</label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                                        placeholder="Please provide a reason for your leave..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={applying}>
                                        {applying ? 'Submitting...' : 'Submit Application'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
                    <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Delete Leave Application</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Are you sure you want to delete this leave application?</p>
                                    <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDeleteLeave(deleteConfirm._id)}>
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageContainer>
    );
};

export default MyLeaves;
