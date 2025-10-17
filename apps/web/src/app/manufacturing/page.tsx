'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Settings, 
  ClipboardList, 
  BarChart3,
  Plus,
  FileText,
  Wrench,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const manufacturingModules = [
  {
    title: 'Bill of Materials',
    description: 'Manage BOMs with multi-level structure and costing',
    icon: FileText,
    href: '/manufacturing/bom',
    color: 'bg-blue-500',
    stats: { total: 0, active: 0 }
  },
  {
    title: 'Work Orders',
    description: 'Production planning and scheduling',
    icon: ClipboardList,
    href: '/manufacturing/work-order',
    color: 'bg-green-500',
    stats: { total: 0, inProgress: 0 }
  },
  {
    title: 'Job Cards',
    description: 'Shop floor operations and time tracking',
    icon: Clock,
    href: '/manufacturing/job-card',
    color: 'bg-orange-500',
    stats: { total: 0, active: 0 }
  },
  {
    title: 'Workstations',
    description: 'Manage production workstations and capacity',
    icon: Settings,
    href: '/manufacturing/workstation',
    color: 'bg-purple-500',
    stats: { total: 0, active: 0 }
  },
  {
    title: 'Operations',
    description: 'Define manufacturing operations',
    icon: Wrench,
    href: '/manufacturing/operation',
    color: 'bg-indigo-500',
    stats: { total: 0 }
  },
  {
    title: 'Reports',
    description: 'Manufacturing analytics and reports',
    icon: BarChart3,
    href: '/manufacturing/reports',
    color: 'bg-red-500',
    stats: {}
  }
];

const quickActions = [
  {
    title: 'New BOM',
    description: 'Create a new Bill of Materials',
    href: '/manufacturing/bom/new',
    icon: Plus,
    color: 'bg-blue-500'
  },
  {
    title: 'New Work Order',
    description: 'Create a new Work Order',
    href: '/manufacturing/work-order/new',
    icon: Plus,
    color: 'bg-green-500'
  },
  {
    title: 'New Job Card',
    description: 'Create a new Job Card',
    href: '/manufacturing/job-card/new',
    icon: Plus,
    color: 'bg-orange-500'
  }
];

export default function ManufacturingPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturing</h1>
            <p className="text-gray-600 mt-1">
              Manage production planning, BOMs, work orders, and shop floor operations
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Manufacturing Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manufacturingModules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Manufacturing Activity</CardTitle>
            <CardDescription>
              Latest updates from your manufacturing operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent manufacturing activity</p>
              <p className="text-sm">Start by creating a BOM or Work Order</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}