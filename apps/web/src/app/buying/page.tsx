'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  DocumentTextIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function BuyingPage() {
  const buyingModules = [
    {
      title: 'Purchase Order',
      description: 'Create and manage purchase orders to suppliers',
      href: '/buying/purchase-order',
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Purchase Invoice',
      description: 'Process supplier invoices and track payments',
      href: '/buying/purchase-invoice',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Purchase Receipt',
      description: 'Record receipt of goods from suppliers',
      href: '/buying/purchase-receipt',
      icon: TruckIcon,
      color: 'bg-orange-500',
    },
    {
      title: 'Supplier',
      description: 'Manage supplier information and relationships',
      href: '/buying/supplier',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Supplier Quotation',
      description: 'Manage supplier quotations and comparisons',
      href: '/buying/supplier-quotation',
      icon: ClipboardDocumentListIcon,
      color: 'bg-indigo-500',
    },
    {
      title: 'Purchase Analytics',
      description: 'View purchase reports and analytics',
      href: '/buying/analytics',
      icon: ChartBarIcon,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="buying-module">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Buying</h1>
        <p className="mt-2 text-gray-600">
          Manage your procurement processes, from purchase orders to supplier payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buyingModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {module.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {module.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Orders</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpaid Bills</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TruckIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Receipts</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Purchases</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}