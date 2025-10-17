'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArchiveBoxIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  QrCodeIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function StockModulePage() {
  const stockModules = [
    {
      title: 'Item Master',
      description: 'Manage items, variants, and item attributes',
      href: '/stock/item',
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Stock Entry',
      description: 'Record stock movements and transactions',
      href: '/stock/stock-entry',
      icon: ArchiveBoxIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Material Request',
      description: 'Create and manage material requests',
      href: '/stock/material-request',
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Warehouse',
      description: 'Manage warehouses and locations',
      href: '/stock/warehouse',
      icon: BuildingStorefrontIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Serial No',
      description: 'Track serial numbers and assets',
      href: '/stock/serial-no',
      icon: QrCodeIcon,
      color: 'bg-indigo-500',
    },
    {
      title: 'Batch',
      description: 'Manage batch numbers and expiry',
      href: '/stock/batch',
      icon: TagIcon,
      color: 'bg-pink-500',
    },
    {
      title: 'Stock Reports',
      description: 'View stock balance, ledger, and analytics',
      href: '/stock/reports',
      icon: ChartBarIcon,
      color: 'bg-red-500',
    },
    {
      title: 'Item Group',
      description: 'Organize items into groups',
      href: '/stock/item-group',
      icon: DocumentTextIcon,
      color: 'bg-gray-500',
    },
  ];

  const quickActions = [
    {
      title: 'New Stock Entry',
      description: 'Create a new stock transaction',
      href: '/stock/stock-entry/new',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'New Material Request',
      description: 'Request materials for purchase or transfer',
      href: '/stock/material-request/new',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'New Item',
      description: 'Add a new item to inventory',
      href: '/stock/item/new',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Stock Balance Report',
      description: 'View current stock levels',
      href: '/stock/reports?type=stock-balance',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage inventory, track stock movements, and generate reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`p-4 rounded-lg text-white transition-colors ${action.color}`}
              >
                <h3 className="font-medium">{action.title}</h3>
                <p className="text-sm opacity-90 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stock Modules */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Stock Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stockModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{module.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">Latest Stock Transactions</h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-sm text-gray-500">
                <p>No recent transactions found.</p>
                <p className="mt-2">
                  <Link href="/stock/stock-entry/new" className="text-blue-600 hover:text-blue-500">
                    Create your first stock entry
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <CubeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warehouses</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <ArchiveBoxIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-semibold text-gray-900">₹0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}