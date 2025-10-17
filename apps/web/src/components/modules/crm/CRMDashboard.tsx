'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

const CRMDashboard: React.FC = () => {
  // Mock data - in real implementation, this would come from API
  const stats = {
    totalLeads: 156,
    openOpportunities: 23,
    monthlyRevenue: 125000,
    conversionRate: 18.5,
    newLeadsThisWeek: 12,
    opportunitiesClosingThisWeek: 5
  };

  const recentLeads = [
    {
      id: '1',
      name: 'John Smith',
      company: 'Tech Solutions Inc',
      status: 'Open',
      source: 'Website',
      created: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      company: 'Marketing Pro',
      status: 'Replied',
      source: 'Email Campaign',
      created: '2024-01-14'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      company: 'Design Studio',
      status: 'Interested',
      source: 'Referral',
      created: '2024-01-13'
    }
  ];

  const upcomingOpportunities = [
    {
      id: '1',
      title: 'Enterprise Software License',
      customer: 'Tech Solutions Inc',
      amount: 45000,
      probability: 75,
      expectedClosing: '2024-01-20'
    },
    {
      id: '2',
      title: 'Marketing Automation Setup',
      customer: 'Marketing Pro',
      amount: 12000,
      probability: 60,
      expectedClosing: '2024-01-22'
    },
    {
      id: '3',
      title: 'Website Redesign Project',
      customer: 'Design Studio',
      amount: 8500,
      probability: 40,
      expectedClosing: '2024-01-25'
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Replied':
        return 'secondary';
      case 'Interested':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Track leads, opportunities, and customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/leads">
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
          <Link href="/crm/opportunities">
            <Button className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              <p className="text-sm text-green-600">+{stats.newLeadsThisWeek} this week</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openOpportunities}</p>
              <p className="text-sm text-orange-600">{stats.opportunitiesClosingThisWeek} closing this week</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-green-600">+2.3% from last month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
            <Link href="/crm/leads">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{lead.name}</span>
                    <Badge variant={getStatusBadgeVariant(lead.status)} className="text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{lead.company}</p>
                  <p className="text-xs text-gray-500">Source: {lead.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(lead.created).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Opportunities */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Opportunities</h3>
            <Link href="/crm/opportunities">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
                    <p className="text-sm text-gray-600">{opportunity.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${opportunity.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {opportunity.probability}% probability
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Expected: {new Date(opportunity.expectedClosing).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${opportunity.probability}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/crm/leads">
            <Button variant="outline" className="w-full flex items-center gap-2 h-auto p-4">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Manage Leads</p>
                <p className="text-xs text-gray-500">View and edit leads</p>
              </div>
            </Button>
          </Link>
          
          <Link href="/crm/opportunities">
            <Button variant="outline" className="w-full flex items-center gap-2 h-auto p-4">
              <Target className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Opportunities</p>
                <p className="text-xs text-gray-500">Track sales pipeline</p>
              </div>
            </Button>
          </Link>
          
          <Link href="/crm/customers">
            <Button variant="outline" className="w-full flex items-center gap-2 h-auto p-4">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Customers</p>
                <p className="text-xs text-gray-500">Manage customer data</p>
              </div>
            </Button>
          </Link>
          
          <Link href="/crm/analytics">
            <Button variant="outline" className="w-full flex items-center gap-2 h-auto p-4">
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-gray-500">View CRM reports</p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default CRMDashboard;