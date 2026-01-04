import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Clock, Award } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { getMyReviews, acknowledgeReview } from '@/api/reviewApi';
import { message } from 'antd';
import dayjs from 'dayjs';

const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await getMyReviews();
            setReviews(response.data.data);
        } catch (error) {
            message.error('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (reviewId) => {
        try {
            await acknowledgeReview(reviewId);
            message.success('Review acknowledged successfully');
            fetchReviews();
        } catch (error) {
            message.error('Failed to acknowledge review');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Draft': 'bg-muted text-muted-foreground',
            'Under-Review': 'bg-yellow-100 text-yellow-700',
            'Completed': 'bg-green-100 text-green-700',
            'Acknowledged': 'bg-blue-100 text-blue-700'
        };
        return badges[status] || 'bg-muted text-muted-foreground';
    };

    const renderStars = (score) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Performance Reviews</h1>
                        <p className="mt-2 text-sm text-muted-foreground">View your performance evaluations and feedback</p>
                    </div>
                    <Award className="h-12 w-12 text-blue-600" />
                </div>
            </div>

            {/* Reviews List */}
            <div className="grid gap-6">
                {reviews.map((review) => (
                    <Card key={review._id} className="border-2">
                        <CardHeader className="border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {review.reviewType} Review - {dayjs(review.reviewPeriod.endDate).format('MMM YYYY')}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Period: {dayjs(review.reviewPeriod.startDate).format('MMM DD, YYYY')} - {dayjs(review.reviewPeriod.endDate).format('MMM DD, YYYY')}
                                    </p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(review.status)}`}>
                                    {review.status}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {/* Overall Rating */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600">{review.ratings?.overallRating || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">Overall Rating</div>
                                </div>
                                <div className="flex gap-1">
                                    {renderStars(Math.round(review.ratings?.overallRating || 0))}
                                </div>
                            </div>

                            {/* Detailed Ratings */}
                            {review.status !== 'Draft' && review.ratings && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {Object.entries(review.ratings).filter(([key]) => key !== 'overallRating').map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                            <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {renderStars(value.score)}
                                                </div>
                                                <span className="text-sm font-bold">{value.score}/5</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Manager Comments */}
                            {review.managerComments && (
                                <div className="space-y-3 mb-6">
                                    <h4 className="font-semibold">Manager Feedback</h4>
                                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                        <p className="text-sm font-medium text-green-800">Strengths</p>
                                        <p className="text-sm mt-1">{review.managerComments.strengths}</p>
                                    </div>
                                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                                        <p className="text-sm font-medium text-yellow-800">Areas for Improvement</p>
                                        <p className="text-sm mt-1">{review.managerComments.weaknesses}</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                        <p className="text-sm font-medium text-blue-800">Overall Feedback</p>
                                        <p className="text-sm mt-1">{review.managerComments.overallFeedback}</p>
                                    </div>
                                </div>
                            )}

                            {/* Salary Adjustment */}
                            {review.salaryAdjustment?.recommended && (
                                <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="h-5 w-5 text-green-600" />
                                        <span className="font-semibold text-green-800">Salary Adjustment Recommended</span>
                                    </div>
                                    <p className="text-sm">
                                        <strong>{review.salaryAdjustment.type}:</strong> {review.salaryAdjustment.percentage}%
                                        {review.salaryAdjustment.effectiveDate && (
                                            <span className="ml-2">
                                                (Effective: {dayjs(review.salaryAdjustment.effectiveDate).format('MMM DD, YYYY')})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm mt-1 text-muted-foreground">Reason: {review.salaryAdjustment.reason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                {review.status === 'Completed' && (
                                    <Button onClick={() => handleAcknowledge(review._id)} className="gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Acknowledge Review
                                    </Button>
                                )}
                                {review.status === 'Acknowledged' && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="text-sm font-medium">Acknowledged on {dayjs(review.acknowledgedAt).format('MMM DD, YYYY')}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {reviews.length === 0 && !loading && (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No performance reviews yet</p>
                            <p className="text-sm text-muted-foreground mt-2">Your reviews will appear here once completed by your manager</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageContainer>
    );
};

export default MyReviews;
