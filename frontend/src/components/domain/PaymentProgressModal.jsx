import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const PaymentProgressModal = ({
    isOpen,
    employee,
    payroll,
    currentStep,
    status,
    error,
    transactionId,
    isBulk = false,
    employeeCount = 0
}) => {
    if (!isOpen) return null;

    const steps = [
        {
            id: 1,
            label: 'Calculating salary components',
            amount: payroll?.earnings?.gross || 0,
            duration: 600
        },
        {
            id: 2,
            label: 'Applying deductions (PF, PT, ESI)',
            amount: payroll?.deductions?.total || 0,
            duration: 500
        },
        {
            id: 3,
            label: 'Generating payslip PDF',
            duration: 1000
        },
        {
            id: 4,
            label: 'Uploading to Cloudinary',
            duration: 900
        },
        {
            id: 5,
            label: 'Initiating NEFT transfer',
            subtitle: 'Processing bank transaction',
            duration: 1200
        },
        {
            id: 6,
            label: 'Bank processing payment',
            subtitle: 'Awaiting confirmation',
            duration: 1500
        },
        {
            id: 7,
            label: 'Payment confirmed by bank',
            amount: payroll?.netSalary || 0,
            duration: 800
        },
        {
            id: 8,
            label: 'Sending email notification',
            subtitle: employee?.email,
            duration: 600
        }
    ];

    const getStepStatus = (stepId) => {
        if (status === 'error') {
            return stepId < currentStep ? 'complete' : stepId === currentStep ? 'error' : 'pending';
        }
        if (stepId < currentStep) return 'complete';
        if (stepId === currentStep) return 'loading';
        return 'pending';
    };

    const renderStepIcon = (stepId) => {
        const stepStatus = getStepStatus(stepId);

        switch (stepStatus) {
            case 'complete':
                return <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in zoom-in duration-300" />;
            case 'loading':
                return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Circle className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-card border-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold">
                            {status === 'success' ? '✓ Payment Completed' :
                                status === 'error' ? '✗ Payment Failed' :
                                    '⟳ Processing Payment'}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Employee Info */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                {isBulk ? 'Bulk Payment' : 'Employee'}
                            </span>
                            <span className="font-semibold">
                                {isBulk ? `${employeeCount} employees` : employee?.name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Net Amount</span>
                            <span className="text-2xl font-bold text-green-600">
                                {formatCurrency(payroll?.netSalary || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-3">
                        {steps.map((step) => {
                            const stepStatus = getStepStatus(step.id);
                            const isActive = step.id === currentStep;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' :
                                        stepStatus === 'complete' ? 'bg-green-50/50 dark:bg-green-950/20' :
                                            'bg-muted/30'
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {renderStepIcon(step.id)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-medium ${stepStatus === 'complete' ? 'text-green-700 dark:text-green-400' :
                                                stepStatus === 'loading' ? 'text-blue-700 dark:text-blue-400' :
                                                    stepStatus === 'error' ? 'text-red-700 dark:text-red-400' :
                                                        'text-muted-foreground'
                                                }`}>
                                                {step.label}
                                            </p>
                                            {step.amount > 0 && (
                                                <span className={`text-sm font-semibold ${stepStatus === 'complete' ? 'text-foreground' : 'text-muted-foreground'
                                                    }`}>
                                                    {formatCurrency(step.amount)}
                                                </span>
                                            )}
                                        </div>
                                        {step.subtitle && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {step.subtitle}
                                            </p>
                                        )}

                                        {/* Progress bar for active step */}
                                        {isActive && stepStatus === 'loading' && (
                                            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full animate-progress-bar"
                                                    style={{ animation: `progress ${step.duration}ms linear` }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Success Message */}
                    {status === 'success' && transactionId && (
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-800 dark:text-green-200">
                                    Payment processed successfully!
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 pl-7">
                                <p>Transaction ID: <span className="font-mono text-foreground">{transactionId}</span></p>
                                <p>Payslip sent to {employee?.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {status === 'error' && error && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="font-semibold text-red-800 dark:text-red-200">
                                    Payment failed
                                </span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-2 pl-7">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Processing Message */}
                    {status === 'processing' && (
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Processing payment... Please wait
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
        </div>
    );
};

export default PaymentProgressModal;
