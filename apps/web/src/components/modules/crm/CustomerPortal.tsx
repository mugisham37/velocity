'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  FileText, 
  CreditCard, 
  Package, 
  MessageSquare, 
  Download,
  Eye,
  Calendar,
  DollarSign,
  Truck
} from 'lucide-react';

interface CustomerPortalProps {
  customerId: string;
  customerName: string;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customerId,
  customerName
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real implementation, this would come from API
  const customerData = {
    profile: {
      name: customerName,
      email: 'customer@example.com',
      phone: '+1 234 567 8900',
      address: '123 Business St, City, State 12345',
      accountBalance: 2500.00,
      creditLimit: 10000.00,
      outstandingAmount: 1200.00
    },
    recentOrders: [
      {
        id: 'SO-2024-001',
        date: '2024-01-15',
        status: 'Delivered',
        amount: 1500.00,
        items: 3
      },
      {
        id: 'SO-2024-002',
        date: '2024-01-10',
        status: 'In Transit',
        amount: 800.00,
        items: 2
      },
      {
        id: 'SO-2024-003',
        date: '2024-01-05',
        status: 'Processing',
        amount: 1200.00,
        items: 4
      }
    ],
    invoices: [
      {
        id: 'INV-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        amount: 1500.00,
        status: 'Paid',
        downloadUrl: '#'
      },
      {
        id: 'INV-2024-002',
        date: '2024-01-10',
        dueDate: '2024-02-10',
        amount: 800.00,
        status: 'Outstanding',
        downloadUrl: '#'
      }
    ],
    supportTickets: [
      {
        id: 'TKT-001',
        subject: 'Product inquiry',
        status: 'Open',
        priority: 'Medium',
        created: '2024-01-14',
        lastUpdate: '2024-01-15'
      },
      {
        id: 'TKT-002',
        subject: 'Delivery issue',
        status: 'Resolved',
        priority: 'High',
        created: '2024-01-10',
        lastUpdate: '2024-01-12'
      }
    ]
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
      case 'resolved':
        return 'default';
      case 'in transit':
      case 'processing':
      case 'open':
        return 'secondary';
      case 'outstanding':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Portal</h1>
          <p className="text-gray-600">Welcome back, {customerName}</p>
        </div>
        <Button className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Contact Support
        </Button>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Account Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ${customerData.profile.accountBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ${customerData.profile.outstandingAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Credit Limit</p>
              <p className="text-2xl font-bold text-blue-600">
                ${customerData.profile.creditLimit.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{customerData.profile.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{customerData.profile.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <p className="font-medium">{customerData.profile.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Address:</span>
                  <p className="font-medium">{customerData.profile.address}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Update Profile
              </Button>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Order SO-2024-001 delivered</p>
                    <p className="text-sm text-gray-500">January 15, 2024</p>
                  </div>
                  <Badge variant="default">Delivered</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Invoice INV-2024-002 generated</p>
                    <p className="text-sm text-gray-500">January 10, 2024</p>
                  </div>
                  <Badge variant="secondary">Outstanding</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Support ticket TKT-001 created</p>
                    <p className="text-sm text-gray-500">January 14, 2024</p>
                  </div>
                  <Badge variant="secondary">Open</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Button variant="outline">View All Orders</Button>
            </div>
            <div className="space-y-4">
              {customerData.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.date).toLocaleDateString()} • {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">${order.amount.toLocaleString()}</p>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
              <Button variant="outline">View All Invoices</Button>
            </div>
            <div className="space-y-4">
              {customerData.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
              <Button>Create New Ticket</Button>
            </div>
            <div className="space-y-4">
              {customerData.supportTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(ticket.created).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Last Update: {new Date(ticket.lastUpdate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPortal;