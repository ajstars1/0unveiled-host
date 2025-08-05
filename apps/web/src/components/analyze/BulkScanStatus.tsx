'use client';

import { Button } from '@/components/ui/button';

interface BulkScanStatusProps {
  isScanning: boolean;
  currentScanRepo: string;
  completedCount: number;
  onCancel: () => void;
}

export function BulkScanStatus({
  isScanning,
  currentScanRepo,
  completedCount,
  onCancel,
}: BulkScanStatusProps) {
  if (!isScanning) return null;

  return (
    <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 font-semibold text-lg">
            Bulk Repository Analysis
          </span>
        </div>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
        >
          Cancel
        </Button>
      </div>
      <div className="text-blue-700 font-medium mb-2">
        Currently analyzing: {currentScanRepo}
      </div>
      <div className="text-sm text-blue-600">
        Each repository takes 30-60 seconds to analyze. You can
        cancel at any time and view partial results.
      </div>
      {completedCount > 0 && (
        <div className="mt-3 text-sm text-green-700">
          ✓ {completedCount} repositories analyzed so far
        </div>
      )}
    </div>
  );
}
