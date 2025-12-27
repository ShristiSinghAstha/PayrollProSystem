import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star, TrendingUp } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { getAllReviews, createReview, completeReview, applySalaryAdjustments } from '@/api/reviewApi';
import { getEmployees } from '@/api/employeeApi';
import { message } from 'antd';
import dayjs from 'dayjs';

const PerformanceReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        reviewType: 'Quarterly',
        reviewPeriod: {
            startDate: '',
            endDate: ''
        },
        ratings: {
            technicalSkills: { score: 3, comments: '' },
            communication: { score: 3, comments: '' },
            teamwork: { score: 3, comments: '' },
            productivity: { score: 3, comments: '' },
            initiative: { score: 3, comments: '' }
        },
        managerComments: {
            strengths: '',
            weaknesses: '',
            overallFeedback: ''
        },
        salaryAdjustment: {
            recommended: false,
            type: 'None',
            percentage: 0,
            reason: ''
        }
    });

    useEffect(() => {
        fetchReviews();
        fetchEmployees();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await getAllReviews();
            setReviews(response.data.data);
        } catch (error) {
            message.error('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await getEmployees({ role: 'employee' });
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Failed to fetch employees');
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await createReview(formData);
            message.success('Performance review created successfully');
            setShowForm(false);
            fetchReviews();
            resetForm();
        } catch (error) {
            message.error(error.response?.data?.error?.message || 'Failed to create review');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (reviewId) => {
        try {
            await completeReview(reviewId);
            message.success('Review completed successfully');
            fetchReviews();
        } catch (error) {
            message.error('Failed to complete review');
        }
    };

    const handleApplySalaryAdjustments = async () => {
        try {
            const response = await applySalaryAdjustments();
            message.success(`Salary adjustments applied for ${response.data.data.adjustments.length} employees`);
            fetchReviews();
        } catch (error) {
            message.error('Failed to apply adjustments');
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            reviewType: 'Quarterly',
            reviewPeriod: { startDate: '', endDate: '' },
            ratings: {
                technicalSkills: { score: 3, comments: '' },
                communication: { score: 3, comments: '' },
                teamwork: { score: 3, comments: '' },
                productivity: { score: 3, comments: '' },
                initiative: { score: 3, comments: '' }
            },
            managerComments: { strengths: '', weaknesses: '', overallFeedback: '' },
            salaryAdjustment: { recommended: false, type: 'None', percentage: 0, reason: '' }
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Draft': 'bg-gray-100 text-gray-700',
            'Under-Review': 'bg-yellow-100 text-yellow-700',
            'Completed': 'bg-green-100 text-green-700',
            'Acknowledged': 'bg-blue-100 text-blue-700'
        };
        return badges[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Performance Reviews</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Manage employee performance evaluations</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleApplySalaryAdjustments} className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Apply Salary Adjustments
                        </Button>
                        <Button size="lg" onClick={() => setShowForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Review
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create Review Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="w-full max-w-3xl bg-white my-8">
                        <CardHeader className="border-b">
                            <CardTitle>Create Performance Review</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Employee</label>
                                    <select
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Review Type</label>
                                    <select
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.reviewType}
                                        onChange={(e) => setFormData({ ...formData, reviewType: e.target.value })}
                                    >
                                        <option>Quarterly</option>
                                        <option>Half-Yearly</option>
                                        <option>Annual</option>
                                        <option>Probation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.reviewPeriod.startDate}
                                        onChange={(e) => setFormData({ ...formData, reviewPeriod: { ...formData.reviewPeriod, startDate: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.reviewPeriod.endDate}
                                        onChange={(e) => setFormData({ ...formData, reviewPeriod: { ...formData.reviewPeriod, endDate: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {/* Ratings */}
                            <div>
                                <h4 className="font-semibold mb-3">Performance Ratings (1-5)</h4>
                                {Object.keys(formData.ratings).map(key => (
                                    <div key={key} className="mb-3">
                                        <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                        <div className="flex gap-4 mt-1">
                                            <input
                                                type="number"
                                                min="1"
                                                max="5"
                                                className="w-20 px-3 py-2 border rounded-md"
                                                value={formData.ratings[key].score}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ratings: {
                                                        ...formData.ratings,
                                                        [key]: { ...formData.ratings[key], score: parseInt(e.target.value) }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Comments..."
                                                className="flex-1 px-3 py-2 border rounded-md"
                                                value={formData.ratings[key].comments}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    ratings: {
                                                        ...formData.ratings,
                                                        [key]: { ...formData.ratings[key], comments: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Manager Comments */}
                            <div>
                                <h4 className="font-semibold mb-3">Manager Feedback</h4>
                                <textarea
                                    placeholder="Strengths..."
                                    className="w-full px-3 py-2 border rounded-md mb-2"
                                    rows={2}
                                    value={formData.managerComments.strengths}
                                    onChange={(e) => setFormData({ ...formData, managerComments: { ...formData.managerComments, strengths: e.target.value } })}
                                />
                                <textarea
                                    placeholder="Areas for Improvement..."
                                    className="w-full px-3 py-2 border rounded-md mb-2"
                                    rows={2}
                                    value={formData.managerComments.weaknesses}
                                    onChange={(e) => setFormData({ ...formData, managerComments: { ...formData.managerComments, weaknesses: e.target.value } })}
                                />
                                <textarea
                                    placeholder="Overall Feedback..."
                                    className="w-full px-3 py-2 border rounded-md"
                                    rows={2}
                                    value={formData.managerComments.overallFeedback}
                                    onChange={(e) => setFormData({ ...formData, managerComments: { ...formData.managerComments, overallFeedback: e.target.value } })}
                                />
                            </div>

                            {/* Salary Adjustment */}
                            <div>
                                <h4 className="font-semibold mb-3">Salary Adjustment</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.salaryAdjustment.recommended}
                                            onChange={(e) => setFormData({ ...formData, salaryAdjustment: { ...formData.salaryAdjustment, recommended: e.target.checked } })}
                                        />
                                        <label className="text-sm font-medium">Recommend Adjustment</label>
                                    </div>
                                    {formData.salaryAdjustment.recommended && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium">Type</label>
                                                <select
                                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                                    value={formData.salaryAdjustment.type}
                                                    onChange={(e) => setFormData({ ...formData, salaryAdjustment: { ...formData.salaryAdjustment, type: e.target.value } })}
                                                >
                                                    <option>Increment</option>
                                                    <option>Bonus</option>
                                                    <option>Promotion</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Percentage</label>
                                                <input
                                                    type="number"
                                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                                    value={formData.salaryAdjustment.percentage}
                                                    onChange={(e) => setFormData({ ...formData, salaryAdjustment: { ...formData.salaryAdjustment, percentage: parseFloat(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium">Reason</label>
                                                <input
                                                    type="text"
                                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                                    value={formData.salaryAdjustment.reason}
                                                    onChange={(e) => setFormData({ ...formData, salaryAdjustment: { ...formData.salaryAdjustment, reason: e.target.value } })}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={loading || !formData.employeeId}>
                                    {loading ? 'Creating...' : 'Create Review'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reviews List */}
            <div className="grid gap-4">
                {reviews.map((review) => (
                    <Card key={review._id} className="border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">
                                            {review.employeeId?.personalInfo?.firstName} {review.employeeId?.personalInfo?.lastName}
                                        </h3>
                                        <span className="text-sm text-muted-foreground">({review.employeeId?.employeeId})</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(review.status)}`}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                                        <div>
                                            <p className="text-muted-foreground">Review Type</p>
                                            <p className="font-semibold">{review.reviewType}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Period</p>
                                            <p className="font-semibold">{dayjs(review.reviewPeriod.endDate).format('MMM YYYY')}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Overall Rating</p>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <p className="font-semibold">{review.ratings?.overallRating || 'N/A'}/5</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Salary Adjustment</p>
                                            <p className="font-semibold">
                                                {review.salaryAdjustment?.recommended ? `${review.salaryAdjustment.percentage}%` : 'None'}
                                            </p>
                                        </div>
                                    </div>
                                    {review.status === 'Draft' && (
                                        <Button size="sm" onClick={() => handleComplete(review._id)}>Complete Review</Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};

export default PerformanceReviews;
