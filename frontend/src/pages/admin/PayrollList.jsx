import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, Clock, CheckCircle2, DollarSign, ArrowRight, TrendingUp, X, Search, Filter } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { getMonthlyPayrollSummary, processMonthlyPayroll } from '@/api/payrollApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { message } from 'antd';

const PayrollList = () => {
    const navigate = useNavigate();
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');

    // Filter states
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            setLoading(true);
            const response = await getMonthlyPayrollSummary();
            setSummaries(response.data.data || []);
        } catch (error) {
            message.error('Failed to load payroll summaries');
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totals = {
        totalCycles: summaries?.length || 0,
        pendingApprovals: summaries?.reduce((sum, item) => sum + (item.pending || 0), 0) || 0,
        completedPayments: summaries?.reduce((sum, item) => sum + (item.paid || 0), 0) || 0,
        totalAmount: summaries?.reduce((sum, item) => sum + (item.totalNet || item.totalAmount || 0), 0) || 0,
    };

    const handleProcessPayroll = async () => {
        if (!selectedMonth) {
            message.error('Please select a month');
            return;
        }

        try {
            setProcessing(true);
            // Parse the selected month (format: "2026-01") into year and month
            const [year, month] = selectedMonth.split('-');
            await processMonthlyPayroll({
                year: parseInt(year),
                month: parseInt(month)
            });
            message.success('Payroll processing started successfully');
            setShowProcessModal(false);
            setSelectedMonth('');
            fetchSummaries();
            // Navigate to the newly processed payroll
            navigate(`/admin/payroll/${selectedMonth}`);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to process payroll');
        } finally {
            setProcessing(false);
        }
    };

    // Generate month options (current month + next 4 months = 5 total)
    const getMonthOptions = () => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 5; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };

    // Get unique years from summaries (with safety check)
    const availableYears = summaries && summaries.length > 0
        ? [...new Set(summaries.map(s => new Date(s.month).getFullYear()))].sort((a, b) => b - a)
        : [];

    // Filter summaries (with safety check)
    const filteredSummaries = (summaries || []).filter(payroll => {
        const payrollDate = new Date(payroll.month);
        const payrollYear = payrollDate.getFullYear();
        const monthName = payrollDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        // Year filter
        if (selectedYear !== 'all' && payrollYear !== parseInt(selectedYear)) {
            return false;
        }

        // Status filter
        if (selectedStatus !== 'all') {
            if (selectedStatus === 'pending' && payroll.pending === 0) return false;
            if (selectedStatus === 'approved' && payroll.approved === 0) return false;
            if (selectedStatus === 'paid' && payroll.paid === 0) return false;
        }

        // Search filter
        if (searchTerm && !monthName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        return true;
    });

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Payroll Management</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Manage monthly payroll cycles and employee payments</p>
                    </div>
                    <Button size="lg" className="gap-2" onClick={() => setShowProcessModal(true)}>
                        <Plus className="h-4 w-4" />
                        Process New Payroll
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Payroll Cycles</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{totals.totalCycles}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" />
                                    Last 6 months
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{totals.pendingApprovals}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Awaiting review
                                </p>
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
                                <p className="text-sm font-medium text-muted-foreground">Completed Payments</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">{totals.completedPayments}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Successfully paid
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Disbursed</p>
                                <p className="mt-2 text-3xl font-semibold text-foreground">
                                    {formatCurrency(totals.totalAmount).replace('.00', '')}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <DollarSign className="h-3 w-3" />
                                    All time total
                                </p>
                            </div>
                            <div className="rounded-lg bg-muted p-3">
                                <DollarSign className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <Card className="border mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters</span>
                            {(selectedYear !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                                <span className="text-xs text-muted-foreground">
                                    ({filteredSummaries.length} of {summaries.length})
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Year Filter */}
                            <select
                                className="px-3 py-2 border rounded-md text-sm min-w-[140px]"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="all">All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                className="px-3 py-2 border rounded-md text-sm min-w-[140px]"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="paid">Paid</option>
                            </select>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search month..."
                                    className="pl-9 pr-3 py-2 border rounded-md text-sm min-w-[180px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Clear Filters */}
                            {(selectedYear !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedYear('all');
                                        setSelectedStatus('all');
                                        setSearchTerm('');
                                    }}
                                    className="gap-2"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payroll Cycles */}
            <Card className="border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Payroll Cycles</CardTitle>
                    <CardDescription>View and manage all payroll processing cycles</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredSummaries?.map((payroll) => (
                            <Link key={payroll.month || payroll._id} to={`/admin/payroll/${payroll.month || payroll._id}`}>
                                <div className="group flex cursor-pointer items-center justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/50">
                                    <div className="flex flex-1 items-center gap-6">
                                        {/* Month Info */}
                                        <div className="flex min-w-[140px] items-center gap-3">
                                            <div className="rounded-lg bg-muted p-2.5">
                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{formatDate(payroll.month, 'MMMM YYYY')}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated {formatDate(payroll.updatedAt, 'MMM DD, YYYY')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employee Count */}
                                        <div className="hidden min-w-[140px] md:block">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">{payroll.totalEmployees}</span>
                                                <span className="text-xs text-muted-foreground">Employees</span>
                                            </div>
                                        </div>

                                        {/* Status Badges */}
                                        <div className="hidden flex-1 items-center gap-2 lg:flex">
                                            {payroll.pending > 0 && (
                                                <div className="inline-flex items-center rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {payroll.pending} Pending
                                                </div>
                                            )}
                                            {payroll.approved > 0 && (
                                                <div className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                    {payroll.approved} Approved
                                                </div>
                                            )}
                                            {payroll.paid > 0 && (
                                                <div className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    {payroll.paid} Paid
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="hidden min-w-[120px] text-right xl:block">
                                            <p className="text-sm font-semibold text-foreground">{formatCurrency(payroll.totalNet || payroll.totalAmount || 0)}</p>
                                            <p className="text-xs text-muted-foreground">Total payout</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                                    >
                                        View Details
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredSummaries?.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="rounded-full bg-muted p-6">
                                <Calendar className="h-12 w-12 text-muted-foreground" />
                            </div>
                            {summaries?.length === 0 ? (
                                <>
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">No payroll records yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">Get started by processing your first payroll</p>
                                    <Button className="mt-6 gap-2" onClick={() => setShowProcessModal(true)}>
                                        <Plus className="h-4 w-4" />
                                        Process First Payroll
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">No matching payroll records</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters to see more results</p>
                                    <Button
                                        className="mt-6 gap-2"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedYear('all');
                                            setSelectedStatus('all');
                                            setSearchTerm('');
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Process Payroll Modal */}
            {showProcessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowProcessModal(false)}>
                    <Card className="w-full max-w-md bg-white border-2" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Process New Payroll</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowProcessModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>Select a month to process payroll for all active employees</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Select Month</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="">Choose a month...</option>
                                    {getMonthOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setShowProcessModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleProcessPayroll}
                                    disabled={!selectedMonth || processing}
                                >
                                    {processing ? 'Processing...' : 'Process Payroll'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageContainer>
    );
};

export default PayrollList;