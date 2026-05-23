import React from 'react';
import { formatBytes } from '@/lib/utils';

interface StorageQuotaProps {
  used: number;
  limit: number;
  showDetails?: boolean;
}

export function StorageQuota({ used, limit, showDetails = false }: StorageQuotaProps) {
  const percent = (used / limit) * 100;
  const isWarning = percent >= 90;
  const isCritical = percent >= 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Storage Usage</span>
        <span className={`text-sm font-semibold ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-600'}`}>
          {formatBytes(used)} / {formatBytes(limit)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            isCritical
              ? 'bg-red-500'
              : isWarning
              ? 'bg-orange-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {showDetails && (
        <p className={`mt-2 text-xs ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-500'}`}>
          {isCritical
            ? '❌ Storage full. Delete files to upload more.'
            : isWarning
            ? '⚠️ Approaching storage limit'
            : `✓ ${Math.round(100 - percent)}% available`}
        </p>
      )}
    </div>
  );
}
