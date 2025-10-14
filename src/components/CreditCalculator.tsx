import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface CreditCalculatorProps {
  file: File | null;
  serviceId: string;
  creditCostPerUnit: number;
  onCalculationComplete: (rowCount: number, totalCredits: number) => void;
}

export default function CreditCalculator({
  file,
  serviceId,
  creditCostPerUnit,
  onCalculationComplete
}: CreditCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [rowCount, setRowCount] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);

  useEffect(() => {
    if (!file) {
      setRowCount(0);
      setTotalCredits(0);
      onCalculationComplete(0, 0);
      return;
    }

    calculateCredits();
  }, [file, serviceId, creditCostPerUnit]);

  const calculateCredits = async () => {
    if (!file) return;

    setIsCalculating(true);

    try {
      const text = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();

      let count = 0;

      if (extension === 'csv') {
        const lines = text.split('\n').filter(line => line.trim());
        count = Math.max(0, lines.length - 1);
      } else if (extension === 'xlsx' || extension === 'xls') {
        count = 1;
      } else if (extension === 'pdf') {
        count = 1;
      } else {
        count = 1;
      }

      const credits = count * creditCostPerUnit;

      setRowCount(count);
      setTotalCredits(credits);
      onCalculationComplete(count, credits);
    } catch (error) {
      console.error('Error calculating credits:', error);
      setRowCount(1);
      setTotalCredits(creditCostPerUnit);
      onCalculationComplete(1, creditCostPerUnit);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!file) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Credit Cost</span>
        </div>
      </div>

      {isCalculating ? (
        <div className="flex items-center justify-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-600">Calculating...</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex-1 bg-white rounded px-2 py-1.5 border border-blue-100">
              <span className="text-gray-600">Items: </span>
              <span className="font-bold text-gray-900">{rowCount}</span>
            </div>
            <div className="flex-1 bg-white rounded px-2 py-1.5 border border-blue-100">
              <span className="text-gray-600">Per Item: </span>
              <span className="font-bold text-blue-600">{creditCostPerUnit.toFixed(2)}</span>
            </div>
            <div className="flex-1 bg-blue-600 rounded px-2 py-1.5">
              <span className="text-blue-100">Total: </span>
              <span className="font-bold text-white">{totalCredits.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center">
            {rowCount} × {creditCostPerUnit.toFixed(2)} = {totalCredits.toFixed(2)} credits
          </div>
        </div>
      )}
    </div>
  );
}
