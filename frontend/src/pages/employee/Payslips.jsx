import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { usePayslips } from '@/hooks/usePayslips';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { message } from 'antd';
import { cn } from '@/lib/utils';

const Payslips = () => {
  const { payslips, loading, downloadPayslip } = usePayslips();
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (payslipId, month) => {
    try {
      setDownloading(payslipId);
      await downloadPayslip(payslipId);
      message.success('Payslip downloaded successfully');
    } catch (error) {
      message.error('Failed to download payslip');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Payslips</h1>
        <p className="mt-2 text-sm text-muted-foreground">View and download your salary payslips</p>
      </div>

      {/* Payslips Table */}
      <Card className="border">
        <CardContent className="pt-6">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Month</th>
                  <th className="px-6 py-3">Gross Salary</th>
                  <th className="px-6 py-3">Deductions</th>
                  <th className="px-6 py-3">Net Salary</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips?.map((payslip) => (
                  <tr key={payslip._id} className="border-b hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatDate(payslip.month, 'MMMM YYYY')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {formatCurrency(payslip.grossSalary)}
                    </td>
                    <td className="px-6 py-4 text-destructive font-medium">
                      {formatCurrency(payslip.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 text-foreground font-bold">
                      {formatCurrency(payslip.netSalary)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                        payslip.status === 'Paid'
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {payslip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(payslip._id, payslip.month)}
                        disabled={downloading === payslip._id}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === payslip._id ? 'Downloading...' : 'Download'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {payslips?.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">No payslips found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your payslips will appear here once processed
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Payslips;
