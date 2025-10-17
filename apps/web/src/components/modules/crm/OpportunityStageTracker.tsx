'use client';

import React from 'react';
import { Opportunity } from '@/types/crm';

interface OpportunityStageTrackerProps {
  opportunity: Opportunity;
  onStageChange?: (stage: string) => void;
}

export default function OpportunityStageTracker({ opportunity, onStageChange }: OpportunityStageTrackerProps) {
  const stages = ['Open', 'Quotation', 'Reply', 'Closed', 'Lost', 'Converted'];
  
  const currentStageIndex = stages.indexOf(opportunity.status);

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Opportunity Stage</h3>
      <div className="flex items-center space-x-4">
        {stages.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStageIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              index === currentStageIndex ? 'font-medium text-blue-600' : 'text-gray-600'
            }`}>
              {stage}
            </span>
            {index < stages.length - 1 && (
              <div className={`w-8 h-0.5 ml-4 ${
                index < currentStageIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}