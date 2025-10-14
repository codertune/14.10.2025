import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import BkashPayment from './BkashPayment';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentCredits: number;
  onPurchaseSuccess: () => void;
}

interface CreditPackage {
  amount: number;
  credits: number;
  popular?: boolean;
}

export default function CreditPurchaseModal({
  isOpen,
  onClose,
  userId,
  currentCredits,
  onPurchaseSuccess
}: CreditPurchaseModalProps) {
  const [creditsPerBdt, setCreditsPerBdt] = useState(2.0);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showBkashPayment, setShowBkashPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSystemSettings();
    }
  }, [isOpen]);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get('/api/system-settings');
      if (response.data.success) {
        setCreditsPerBdt(response.data.settings.credits_per_bdt || 2.0);
      }
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
    }
  };

  const packages: CreditPackage[] = [
    { amount: 100, credits: Math.round(100 * creditsPerBdt) },
    { amount: 250, credits: Math.round(250 * creditsPerBdt), popular: true },
    { amount: 500, credits: Math.round(500 * creditsPerBdt) },
    { amount: 1000, credits: Math.round(1000 * creditsPerBdt) }
  ];

  if (!isOpen) return null;

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue >= 0 && numValue <= 100000)) {
      setCustomAmount(value);
      if (numValue >= 50) {
        setSelectedPackage({
          amount: numValue,
          credits: Math.round(numValue * creditsPerBdt)
        });
        setError('');
      } else if (value !== '') {
        setError('Minimum purchase amount is 50 BDT');
        setSelectedPackage(null);
      }
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedPackage) {
      setError('Please select a package or enter an amount');
      return;
    }

    if (selectedPackage.amount < 50) {
      setError('Minimum purchase amount is 50 BDT');
      return;
    }

    setShowBkashPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsProcessing(true);
    setError('');

    try {
      const transactionData = {
        userId,
        transactionType: 'credit_purchase',
        amountBdt: selectedPackage!.amount,
        creditsAmount: selectedPackage!.credits,
        paymentMethod: 'bkash',
        paymentStatus: 'completed',
        transactionId: paymentData.trxID || `TXN-${Date.now()}`,
        gatewayReference: paymentData.paymentID || null,
        paymentDate: new Date().toISOString(),
        notes: `Credit purchase: ${selectedPackage!.credits} credits for ${selectedPackage!.amount} BDT`
      };

      const response = await axios.post('/api/transactions', transactionData);

      if (response.data.success) {
        onPurchaseSuccess();
        handleClose();
      } else {
        setError('Failed to record transaction');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedPackage(null);
      setCustomAmount('');
      setError('');
      setShowBkashPayment(false);
      onClose();
    }
  };

  if (showBkashPayment && selectedPackage) {
    return (
      <BkashPayment
        amount={selectedPackage.amount}
        credits={selectedPackage.credits}
        userId={userId}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowBkashPayment(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Credits</h2>
          <p className="text-sm text-gray-600">
            Current Balance: <span className="font-bold text-green-600">{currentCredits} credits</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Exchange Rate: {creditsPerBdt} credits per 1 BDT
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Packages</h3>
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg, idx) => (
              <button
                key={idx}
                onClick={() => handlePackageSelect(pkg)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedPackage?.amount === pkg.amount && !customAmount
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{pkg.credits}</p>
                  <p className="text-xs text-gray-600 mb-2">credits</p>
                  <div className="bg-gray-100 rounded-lg py-2 px-3">
                    <p className="text-lg font-bold text-green-600">{pkg.amount} BDT</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Amount</h3>
          <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  min="50"
                  max="100000"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Minimum 50 BDT"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">You'll Get</label>
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {customAmount ? Math.round(parseInt(customAmount) * creditsPerBdt) : 0} credits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedPackage && (
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credits:</span>
                    <span className="font-semibold text-gray-900">{selectedPackage.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">{selectedPackage.amount} BDT</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-600">New Balance:</span>
                    <span className="font-bold text-green-600">
                      {currentCredits + selectedPackage.credits} credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={!selectedPackage || isProcessing}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
