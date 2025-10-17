'use client';

import React, { useState } from 'react';
import { 
  GeneralLedgerReport, 
  TrialBalanceReport, 
  ProfitLossReport 
} from '@/components/modules/accounts';
import { 
  DocumentTextIcon,
  CalculatorIcon,
  ChartBarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

type ReportType = 'general-ledger' | 'trial-balance' | 'profit-loss' | 'balance-sheet';

interface ReportOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ className?: string }>;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'general-ledger',
    name: 'General Ledger',
    description: 'Detailed view of all transactions for each account',
    icon: DocumentTextIcon,
    component: GeneralLedgerReport,
  },
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    description: 'Summary of all account balances to verify books are balanced',
    icon: CalculatorIcon,
    component: TrialBalanceReport,
  },
  {
    id: 'profit-loss',
    name: 'Profit & Loss Statement',
    description: 'Income and expense summary for a specific period',
    icon: ChartBarIcon,
    component: ProfitLossReport,
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity at a specific point in time',
    icon: BanknotesIcon,
    component: () => (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Balance Sheet report coming soon...
      </div>
    ),
  },
];

export default function AccountingReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const selectedReportOption = REPORT_OPTIONS.find(option => option.id === selectedReport);

  if (selectedReport && selectedReportOption) {
    const ReportComponent = selectedReportOption.component;
    
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Reports
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {selectedReportOption.name}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedReportOption.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <ReportComponent className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Accounting Reports</h1>
            <p className="mt-1 text-sm text-gray-600">
              Generate and view financial reports and statements
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            
            return (
              <div
                key={option.id}
                onClick={() => setSelectedReport(option.id)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {option.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-800 transition-colors">
                  <span>Generate Report</span>
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="text-sm font-medium text-gray-900">Monthly Closing</div>
              <div className="text-sm text-gray-500 mt-1">Generate month-end reports</div>
            </button>
            <button className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="text-sm font-medium text-gray-900">Year-end Reports</div>
              <div className="text-sm text-gray-500 mt-1">Annual financial statements</div>
            </button>
            <button className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="text-sm font-medium text-gray-900">Tax Reports</div>
              <div className="text-sm text-gray-500 mt-1">Tax filing and compliance</div>
            </button>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="text-sm text-gray-500">No recent reports found</div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Generated reports will appear here for quick access and re-generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}