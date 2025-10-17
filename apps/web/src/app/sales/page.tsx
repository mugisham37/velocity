'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCartIcon, 
  DocumentTextIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function SalesPage() {
  const salesModules = [
    {
      title: 'Sales Order',
      description: 'Create and manage sales orders from customers',
      href: '/sales/sales-order',
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Sales Invoice',
      description: 'Generate invoices and track payments',
      href: '/sales/sales-invoice',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Delivery Note',
      description: 'Manage product deliveries and shipments',
      href: '/sales/delivery-note',
      icon: TruckIcon,
      color: 'bg-orange-500',
    },
    {
      title: 'Customer',
      description: 'Manage customer information and relationships',
      href: '/sales/customer',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Pricing Rules',
      description: 'Configure pricing rules and discounts',
      href: '/sales/pricing-rules',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Sales Analytics',
      description: 'View sales reports and analytics',
      href: '/sales/analytics',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="sales-module">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <p className="mt-2 text-gray-600">
          Manage your sales processes, from orders to invoicing and delivery
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salesModules.map((module) => {
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
                <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Deliveries</p>
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
                <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}