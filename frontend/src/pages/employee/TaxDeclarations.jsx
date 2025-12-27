import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Save, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import PageContainer from '@/components/layout/PageContainer';
import { submitTaxDeclaration, getMyTaxDeclarations, calculateTaxEstimate } from '@/api/taxApi';
import { message } from 'antd';

const TaxDeclarations = () => {
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [taxEstimate, setTaxEstimate] = useState(null);

    const [formData, setFormData] = useState({
        section80C: {
            lic: 0,
            ppf: 0,
            elss: 0,
            homeLoanPrincipal: 0,
            nsc: 0,
            fixedDeposit: 0,
            tuitionFees: 0
        },
        section80D: {
            selfAndFamily: 0,
            parents: 0
        },
        hraDetails: {
            rentPaid: 0,
            landlordName: '',
            landlordPAN: '',
            isMetro: false
        },
        homeLoan: {
            interestPaid: 0
        },
        nps: 0,
        educationLoanInterest: 0
    });

    useEffect(() => {
        fetchDeclarations();
    }, []);

    const fetchDeclarations = async () => {
        try {
            setLoading(true);
            const response = await getMyTaxDeclarations();
            setDeclarations(response.data.data);
        } catch (error) {
            message.error('Failed to fetch declarations');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value === '' ? 0 : parseFloat(value)
            }
        }));
    };

    const calculateEstimate = async () => {
        try {
            const response = await calculateTaxEstimate(formData);
            setTaxEstimate(response.data.data);
            message.success('Tax estimate calculated');
        } catch (error) {
            message.error('Failed to calculate estimate');
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await submitTaxDeclaration(formData);
            message.success('Tax declaration submitted successfully!');
            setShowForm(false);
            fetchDeclarations();
        } catch (error) {
            message.error(error.response?.data?.error?.message || 'Failed to submit declaration');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Draft': 'bg-muted text-muted-foreground border-border',
            'Submitted': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Verified': 'bg-green-100 text-green-700 border-green-300',
            'Rejected': 'bg-red-100 text-red-700 border-red-300'
        };
        return badges[status] || 'bg-muted text-muted-foreground';
    };

    const total80C = Object.values(formData.section80C).reduce((sum, val) => sum + val, 0);
    const total80D = formData.section80D.selfAndFamily + formData.section80D.parents;

    return (
        <PageContainer>
            {/* Header */}
            <div className="border-b bg-card mb-8" style={{ margin: '-24px -24px 32px -24px', padding: '40px 32px' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tax Declarations</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Manage your tax-saving investments and calculate TDS</p>
                    </div>
                    <Button size="lg" onClick={() => setShowForm(true)} className="gap-2">
                        <FileText className="h-4 w-4" />
                        New Declaration
                    </Button>
                </div>
            </div>

            {/* Declaration Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="w-full max-w-4xl bg-white my-8">
                        <CardHeader className="border-b">
                            <CardTitle>Tax Declaration - FY 2024-25</CardTitle>
                            <CardDescription>Enter your tax-saving investments for TDS calculation</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Section 80C */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
                                    Section 80C - Investments
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Total: ₹{total80C.toLocaleString()} / ₹1,50,000
                                    </span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(formData.section80C).map(key => (
                                        <div key={key}>
                                            <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                            <input
                                                type="number"
                                                className="w-full mt-1 px-3 py-2 border rounded-md"
                                                value={formData.section80C[key]}
                                                onChange={(e) => handleInputChange('section80C', key, e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {total80C > 150000 && (
                                    <p className="text-sm text-red-600 mt-2">⚠️ Section 80C limit is ₹1,50,000</p>
                                )}
                            </div>

                            {/* Section 80D */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Section 80D - Medical Insurance</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Self & Family (max ₹25,000)</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            value={formData.section80D.selfAndFamily}
                                            onChange={(e) => handleInputChange('section80D', 'selfAndFamily', e.target.value)}
                                            max={25000}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Parents (max ₹25,000)</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            value={formData.section80D.parents}
                                            onChange={(e) => handleInputChange('section80D', 'parents', e.target.value)}
                                            max={25000}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* HRA Details */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">HRA Exemption</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Annual Rent Paid</label>
                                        <input
                                            type="number"
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            value={formData.hraDetails.rentPaid}
                                            onChange={(e) => handleInputChange('hraDetails', 'rentPaid', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Landlord Name</label>
                                        <input
                                            type="text"
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            value={formData.hraDetails.landlordName}
                                            onChange={(e) => handleInputChange('hraDetails', 'landlordName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Landlord PAN (if rent &gt; ₹1L)</label>
                                        <input
                                            type="text"
                                            className="w-full mt-1 px-3 py-2 border rounded-md"
                                            value={formData.hraDetails.landlordPAN}
                                            onChange={(e) => handleInputChange('hraDetails', 'landlordPAN', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-6">
                                        <input
                                            type="checkbox"
                                            checked={formData.hraDetails.isMetro}
                                            onChange={(e) => handleInputChange('hraDetails', 'isMetro', e.target.checked)}
                                        />
                                        <label className="text-sm font-medium">Living in Metro City</label>
                                    </div>
                                </div>
                            </div>

                            {/* Other Deductions */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Home Loan Interest (Section 24)</label>
                                    <input
                                        type="number"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.homeLoan.interestPaid}
                                        onChange={(e) => handleInputChange('homeLoan', 'interestPaid', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">NPS (80CCD(1B)) - max ₹50,000</label>
                                    <input
                                        type="number"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        value={formData.nps}
                                        onChange={(e) => setFormData({ ...formData, nps: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                        max={50000}
                                    />
                                </div>
                            </div>

                            {/* Tax Estimate Preview */}
                            {taxEstimate && (
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-6">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Calculator className="h-5 w-5 text-blue-600" />
                                            Tax Estimate
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Gross Income</p>
                                                <p className="text-lg font-semibold">₹{taxEstimate.grossIncome?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Total Deductions</p>
                                                <p className="text-lg font-semibold text-green-600">₹{taxEstimate.deductions?.total?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Monthly TDS</p>
                                                <p className="text-lg font-semibold text-red-600">₹{taxEstimate.monthlyTDS?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button variant="outline" onClick={calculateEstimate} className="gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Calculate Estimate
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {loading ? 'Submitting...' : 'Submit Declaration'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Declarations List */}
            <div className="grid gap-4">
                {declarations.map((declaration) => (
                    <Card key={declaration._id} className="border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-semibold">FY {declaration.financialYear}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(declaration.status)}`}>
                                            {declaration.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Section 80C</p>
                                            <p className="font-semibold">₹{declaration.section80C?.total?.toLocaleString() || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Section 80D</p>
                                            <p className="font-semibold">₹{declaration.section80D?.total?.toLocaleString() || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total Deductions</p>
                                            <p className="font-semibold">₹{declaration.totalDeductions?.toLocaleString() || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Submitted</p>
                                            <p className="font-semibold">{declaration.submittedAt ? new Date(declaration.submittedAt).toLocaleDateString() : 'Draft'}</p>
                                        </div>
                                    </div>

                                    {declaration.remarks && (
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <p className="text-sm text-yellow-800"><strong>Remarks:</strong> {declaration.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {declarations.length === 0 && !loading && (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No tax declarations yet</p>
                            <Button className="mt-4" onClick={() => setShowForm(true)}>
                                Create Your First Declaration
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageContainer>
    );
};

export default TaxDeclarations;
