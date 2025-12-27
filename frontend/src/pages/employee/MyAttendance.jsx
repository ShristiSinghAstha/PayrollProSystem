import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Calendar, CheckCircle, XCircle } from "lucide-react";
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { checkIn, checkOut, getMyAttendance } from '@/api/attendanceApi';
import { message } from 'antd';

const MyAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));

    useEffect(() => {
        fetchAttendance();
    }, [currentMonth]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const [year, month] = currentMonth.split('-');
            const response = await getMyAttendance({ month, year });
            setAttendance(response.data.data);

            // Find today's record
            const today = dayjs().format('YYYY-MM-DD');
            const todayRec = response.data.data.find(rec =>
                dayjs(rec.date).format('YYYY-MM-DD') === today
            );
            setTodayRecord(todayRec || null);
        } catch (error) {
            message.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await checkIn('Office');
            message.success('Checked in successfully!');
            fetchAttendance();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to check in');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setCheckingOut(true);
            await checkOut('Office');
            message.success('Checked out successfully!');
            fetchAttendance();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to check out');
        } finally {
            setCheckingOut(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Present': 'bg-green-500',
            'Absent': 'bg-red-500',
            'Half-Day': 'bg-yellow-500',
            'Leave': 'bg-blue-500',
            'Holiday': 'bg-purple-500',
            'Weekend': 'bg-gray-400'
        };
        return colors[status] || 'bg-gray-300';
    };

    // Stats calculation
    const stats = attendance.reduce((acc, rec) => {
        acc[rec.status] = (acc[rec.status] || 0) + 1;
        if (rec.isLate) acc.late = (acc.late || 0) + 1;
        acc.totalHours = (acc.totalHours || 0) + (rec.workHours || 0);
        return acc;
    }, {});

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Attendance</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Track your check-in, check-out, and attendance history</p>
                </div>
            </div>

            {/* Check-in/out Card */}
            <Card className="border mb-8">
                <CardHeader>
                    <CardTitle>Today's Attendance</CardTitle>
                    <CardDescription>{dayjs().format('dddd, MMMM D, YYYY')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {!todayRecord?.checkIn ? (
                            <Button size="lg" onClick={handleCheckIn} disabled={checkingIn} className="gap-2">
                                <LogIn className="h-5 w-5" />
                                {checkingIn ? 'Checking In...' : 'Check In'}
                            </Button>
                        ) : (
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <div>
                                        <p className="font-semibold">Checked In</p>
                                        <p className="text-sm text-muted-foreground">
                                            {dayjs(todayRecord.checkIn.time).format('h:mm A')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {todayRecord?.checkIn && !todayRecord?.checkOut && (
                            <Button size="lg" onClick={handleCheckOut} disabled={checkingOut} variant="outline" className="gap-2">
                                <LogOut className="h-5 w-5" />
                                {checkingOut ? 'Checking Out...' : 'Check Out'}
                            </Button>
                        )}

                        {todayRecord?.checkOut && (
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <div>
                                        <p className="font-semibold">Checked Out</p>
                                        <p className="text-sm text-muted-foreground">
                                            {dayjs(todayRecord.checkOut.time).format('h:mm A')} • {todayRecord.workHours.toFixed(1)} hrs
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="text-2xl font-semibold text-foreground mt-2">{stats.Present || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="text-2xl font-semibold text-foreground mt-2">{stats.Absent || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Late Days</p>
                        <p className="text-2xl font-semibold text-foreground mt-2">{stats.late || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <p className="text-2xl font-semibold text-foreground mt-2">{(stats.totalHours || 0).toFixed(0)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance History */}
            <Card className="border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Attendance History</CardTitle>
                            <CardDescription>Your attendance records for {dayjs(currentMonth).format('MMMM YYYY')}</CardDescription>
                        </div>
                        <input
                            type="month"
                            value={currentMonth}
                            onChange={(e) => setCurrentMonth(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Check In</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Check Out</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hours</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {attendance.map((record) => (
                                    <tr key={record._id}>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{dayjs(record.date).format('DD MMM YYYY')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(record.status)}`}>
                                                {record.status}
                                            </span>
                                            {record.isLate && <span className="ml-2 text-xs text-orange-600">Late</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground">
                                            {record.checkIn?.time ? dayjs(record.checkIn.time).format('h:mm A') : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-foreground">
                                            {record.checkOut?.time ? dayjs(record.checkOut.time).format('h:mm A') : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {record.workHours ? `${record.workHours.toFixed(1)} hrs` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {attendance.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No attendance records for this month</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </PageContainer>
    );
};

export default MyAttendance;
