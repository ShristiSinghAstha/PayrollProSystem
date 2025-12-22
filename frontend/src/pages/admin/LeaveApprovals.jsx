import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Calendar, Filter, User, X } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { getAllLeaves, approveLeave, rejectLeave, getLeaveStats } from '@/api/leaveApi';
import { formatDate } from '@/utils/formatters';
import { useSocket } from '@/contexts/SocketContext';

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({ status: 'Pending' });
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [approveModal, setApproveModal] = useState(false);
    const [rejectModal, setRejectModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { socket, connected } = useSocket();

    useEffect(() => {
        fetchLeaves();
        fetchStats();
    }, [filters]);

    // Socket event listeners for real-time updates
    useEffect(() => {
        if (!socket || !connected) return;

        // Listen for new leave applications
        socket.on('leave:newApplication', (data) => {
            console.log('New leave application received:', data);
            setSuccessMessage(data.message || 'New leave application received');
            setTimeout(() => setSuccessMessage(''), 4000);
            fetchLeaves();
            fetchStats();
        });

        // Listen for any leave status updates
        socket.on('leave:statusUpdate', (data) => {
            console.log('Leave status update received:', data);
            fetchLeaves();
            fetchStats();
        });

        // Cleanup listeners on unmount
        return () => {
            socket.off('leave:newApplication');
            socket.off('leave:statusUpdate');
        };
    }, [socket, connected]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await getAllLeaves(filters);
            setLeaves(response.data.data);
        } catch (error) {
            setErrorMessage('Failed to fetch leave applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getLeaveStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const handleApprove = async () => {
        try {
            setActionLoading(true);
            await approveLeave(selectedLeave._id, remarks);
            setSuccessMessage(`Leave approved for ${selectedLeave.employeeId?.personalInfo?.firstName}`);
            setApproveModal(false);
            setRemarks('');
            setSelectedLeave(null);
            fetchLeaves();
            fetchStats();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to approve leave');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setErrorMessage('Please provide a rejection reason');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            setActionLoading(true);
            await rejectLeave(selectedLeave._id, rejectionReason);
            setSuccessMessage(`Leave rejected for ${selectedLeave.employeeId?.personalInfo?.firstName}`);
            setRejectModal(false);
            setRejectionReason('');
            setSelectedLeave(null);
            fetchLeaves();
            fetchStats();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Failed to reject leave');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setActionLoading(false);
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
            'LOP': 'inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700',
            'Maternity': 'inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700',
            'Paternity': 'inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700'
        };
        return badges[type] || 'inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-700';
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Leave Approvals</h1>
                <p className="mt-2 text-sm text-muted-foreground">Review and manage employee leave applications</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{stats?.byStatus?.Pending?.count || 0}</p>
                            </div>
                            <div className="rounded-lg bg-yellow-50 p-3">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{stats?.byStatus?.Approved?.count || 0}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{stats?.byStatus?.Rejected?.count || 0}</p>
                            </div>
                            <div className="rounded-lg bg-red-50 p-3">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <div className="flex gap-2">
                            <Button
                                variant={filters.status === 'Pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilters({ ...filters, status: 'Pending' })}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={filters.status === 'Approved' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilters({ ...filters, status: 'Approved' })}
                            >
                                Approved
                            </Button>
                            <Button
                                variant={filters.status === 'Rejected' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilters({ ...filters, status: 'Rejected' })}
                            >
                                Rejected
                            </Button>
                            <Button
                                variant={filters.status === '' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilters({ ...filters, status: '' })}
                            >
                                All
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leave Applications Table */}
            <Card className="border">
                <CardHeader>
                    <CardTitle>Leave Applications</CardTitle>
                    <CardDescription>Total: {leaves.length} application(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-600" />
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">
                                                        {leave.employeeId?.personalInfo?.firstName} {leave.employeeId?.personalInfo?.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {leave.employeeId?.employeeId} • {leave.employeeId?.employment?.department}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
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
                                            {leave.status === 'Pending' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLeave(leave);
                                                            setApproveModal(true);
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setSelectedLeave(leave);
                                                            setRejectModal(true);
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {leave.status !== 'Pending' && (
                                                <span className="text-xs text-gray-500">No action required</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {leaves.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No leave applications found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Approve Modal */}
            {approveModal && selectedLeave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setApproveModal(false)}>
                    <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Approve Leave</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setApproveModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                Approve leave for {selectedLeave.employeeId?.personalInfo?.firstName} {selectedLeave.employeeId?.personalInfo?.lastName}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <p className="text-sm font-medium mb-2">Leave Details:</p>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
                                    <p><strong>Duration:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.totalDays} days)</p>
                                    <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Remarks (Optional)</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                                    placeholder="Add any remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setApproveModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleApprove} disabled={actionLoading}>
                                    {actionLoading ? 'Approving...' : 'Approve Leave'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && selectedLeave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRejectModal(false)}>
                    <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Reject Leave</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setRejectModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>
                                Reject leave for {selectedLeave.employeeId?.personalInfo?.firstName} {selectedLeave.employeeId?.personalInfo?.lastName}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <p className="text-sm font-medium mb-2">Leave Details:</p>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
                                    <p><strong>Duration:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.totalDays} days)</p>
                                    <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Rejection Reason *</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                                    placeholder="Please provide a reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setRejectModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                                    {actionLoading ? 'Rejecting...' : 'Reject Leave'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageContainer>
    );
};

export default LeaveApprovals;
