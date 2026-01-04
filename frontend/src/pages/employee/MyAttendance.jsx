import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CheckCircle, AlertCircle, Info } from "lucide-react";
import dayjs from 'dayjs';
import PageContainer from '@/components/layout/PageContainer';
import { checkIn, checkOut, getMyAttendance } from '@/api/attendanceApi';
import { message } from 'antd';

const MyAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [todayRecord, setTodayRecord] = useState(null);
    const [loading, setLoading] = useState(false);
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

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Left: Calendar (2/3 width) */}
                <div className="lg:col-span-2">
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Attendance Calendar</CardTitle>
                                    <CardDescription className="text-xs">{dayjs(currentMonth).format('MMMM YYYY')}</CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'))}
                                    >
                                        ‹
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                        onClick={() => setCurrentMonth(dayjs().format('YYYY-MM'))}
                                    >
                                        Today
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM'))}
                                    >
                                        ›
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            {/* Calendar Grid */}
                            <div className="space-y-2">
                                {/* Day Labels */}
                                <div className="grid grid-cols-7 gap-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                        <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const firstDay = dayjs(currentMonth).startOf('month');
                                        const lastDay = dayjs(currentMonth).endOf('month');
                                        const daysInMonth = lastDay.date();
                                        const startDayOfWeek = firstDay.day();
                                        const days = [];

                                        // Empty cells
                                        for (let i = 0; i < startDayOfWeek; i++) {
                                            days.push(<div key={`empty-${i}`} className="aspect-square" />);
                                        }

                                        // Days
                                        for (let day = 1; day <= daysInMonth; day++) {
                                            const date = dayjs(currentMonth).date(day);
                                            const dateStr = date.format('YYYY-MM-DD');
                                            const record = attendance.find(rec => dayjs(rec.date).format('YYYY-MM-DD') === dateStr);
                                            const isToday = date.isSame(dayjs(), 'day');

                                            let bgColor = 'bg-muted/30';
                                            let dotColor = null;

                                            if (record) {
                                                switch (record.status) {
                                                    case 'Present':
                                                        bgColor = 'bg-green-50 dark:bg-green-950/20';
                                                        dotColor = 'bg-green-500';
                                                        break;
                                                    case 'Absent':
                                                        bgColor = 'bg-red-50 dark:bg-red-950/20';
                                                        dotColor = 'bg-red-500';
                                                        break;
                                                    case 'Half-Day':
                                                        bgColor = 'bg-yellow-50 dark:bg-yellow-950/20';
                                                        dotColor = 'bg-yellow-500';
                                                        break;
                                                    case 'Leave':
                                                        bgColor = 'bg-blue-50 dark:bg-blue-950/20';
                                                        dotColor = 'bg-blue-500';
                                                        break;
                                                    case 'Holiday':
                                                        bgColor = 'bg-purple-50 dark:bg-purple-950/20';
                                                        dotColor = 'bg-purple-500';
                                                        break;
                                                }
                                            }

                                            days.push(
                                                <div
                                                    key={day}
                                                    className={`aspect-square rounded border transition-all hover:shadow-sm cursor-pointer ${bgColor} ${isToday ? 'ring-1 ring-primary' : 'border-border'
                                                        }`}
                                                    title={record?.status || ''}
                                                >
                                                    <div className="h-full flex flex-col items-center justify-center p-0.5">
                                                        <span className={`text-[11px] font-medium ${isToday ? 'text-primary' : 'text-foreground'
                                                            }`}>
                                                            {day}
                                                        </span>
                                                        {dotColor && (
                                                            <div className={`w-1 h-1 rounded-full mt-0.5 ${dotColor}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return days;
                                    })()}
                                </div>

                                {/* Compact Legend */}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t text-[10px]">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">Present</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-muted-foreground">Absent</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <span className="text-muted-foreground">Half-Day</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-muted-foreground">Leave</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-muted-foreground">Holiday</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Today + Stats (1/3 width) */}
                <div className="space-y-4">
                    {/* Today's Status */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Today</CardTitle>
                            <CardDescription className="text-xs">{dayjs().format('MMM D, YYYY')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {todayRecord ? (
                                <>
                                    {todayRecord.checkIn && (
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-muted-foreground">Check In</p>
                                                <p className="text-sm font-semibold">{dayjs(todayRecord.checkIn.time).format('h:mm A')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {todayRecord.checkOut && (
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
                                                <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-muted-foreground">Check Out</p>
                                                <p className="text-sm font-semibold">{dayjs(todayRecord.checkOut.time).format('h:mm A')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {todayRecord.workHours && (
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Work Hours:</span>
                                            <span className="text-sm font-semibold ml-auto">{todayRecord.workHours.toFixed(1)}h</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">No record</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">This Month</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Present</span>
                                <span className="text-lg font-semibold text-green-600">{stats.Present || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Absent</span>
                                <span className="text-lg font-semibold text-red-600">{stats.Absent || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Late Days</span>
                                <span className="text-lg font-semibold text-yellow-600">{stats.late || 0}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-xs text-muted-foreground">Total Hours</span>
                                <span className="text-lg font-semibold">{(stats.totalHours || 0).toFixed(0)}h</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Attendance History Table */}
            <Card className="border">
                <CardHeader>
                    <CardTitle>Detailed Records</CardTitle>
                    <CardDescription>Complete attendance log for {dayjs(currentMonth).format('MMMM YYYY')}</CardDescription>
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
