'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  DollarSign,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  parentTerritory?: string;
  manager: string;
  customerCount: number;
  revenue: number;
  target: number;
  achievement: number;
  status: 'Active' | 'Inactive';
}

interface TerritoryManagementProps {
  onCreateTerritory?: () => void;
  onEditTerritory?: (territory: Territory) => void;
  onViewTerritory?: (territory: Territory) => void;
}

const TerritoryManagement: React.FC<TerritoryManagementProps> = ({
  onCreateTerritory,
  onEditTerritory,
  onViewTerritory
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real implementation, this would come from API
  const territories: Territory[] = [
    {
      id: '1',
      name: 'North America',
      manager: 'John Smith',
      customerCount: 150,
      revenue: 2500000,
      target: 3000000,
      achievement: 83.3,
      status: 'Active'
    },
    {
      id: '2',
      name: 'Europe',
      parentTerritory: 'Global',
      manager: 'Sarah Johnson',
      customerCount: 120,
      revenue: 1800000,
      target: 2000000,
      achievement: 90.0,
      status: 'Active'
    },
    {
      id: '3',
      name: 'Asia Pacific',
      manager: 'Mike Chen',
      customerCount: 80,
      revenue: 1200000,
      target: 1500000,
      achievement: 80.0,
      status: 'Active'
    },
    {
      id: '4',
      name: 'Latin America',
      manager: 'Maria Rodriguez',
      customerCount: 45,
      revenue: 600000,
      target: 800000,
      achievement: 75.0,
      status: 'Active'
    }
  ];

  const territoryStats = {
    totalTerritories: territories.length,
    activeTerritories: territories.filter(t => t.status === 'Active').length,
    totalCustomers: territories.reduce((sum, t) => sum + t.customerCount, 0),
    totalRevenue: territories.reduce((sum, t) => sum + t.revenue, 0),
    totalTarget: territories.reduce((sum, t) => sum + t.target, 0),
    averageAchievement: territories.reduce((sum, t) => sum + t.achievement, 0) / territories.length
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 90) return 'text-green-600';
    if (achievement >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAchievementBadgeVariant = (achievement: number) => {
    if (achievement >= 90) return 'default';
    if (achievement >= 75) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Territory Management</h1>
          <p className="text-gray-600">Manage sales territories and performance tracking</p>
        </div>
        {onCreateTerritory && (
          <Button onClick={onCreateTerritory} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Territory
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Territories</p>
              <p className="text-2xl font-bold text-gray-900">{territoryStats.totalTerritories}</p>
              <p className="text-sm text-green-600">{territoryStats.activeTerritories} active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{territoryStats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Across all territories</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(territoryStats.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-green-600">
                {((territoryStats.totalRevenue / territoryStats.totalTarget) * 100).toFixed(1)}% of target
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
              <p className={`text-2xl font-bold ${getAchievementColor(territoryStats.averageAchievement)}`}>
                {territoryStats.averageAchievement.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Target achievement</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Territory List</h3>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
            <div className="space-y-4">
              {territories.map((territory) => (
                <div key={territory.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{territory.name}</p>
                        <Badge variant={territory.status === 'Active' ? 'default' : 'secondary'}>
                          {territory.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">Manager: {territory.manager}</p>
                      {territory.parentTerritory && (
                        <p className="text-sm text-gray-500">Parent: {territory.parentTerritory}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Customers</p>
                      <p className="font-semibold">{territory.customerCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-semibold">${(territory.revenue / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Achievement</p>
                      <Badge variant={getAchievementBadgeVariant(territory.achievement)}>
                        {territory.achievement.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {onViewTerritory && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTerritory(territory)}
                          title="View Territory"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditTerritory && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTerritory(territory)}
                          title="Edit Territory"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart Placeholder */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Target</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </Card>

            {/* Top Performing Territories */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Territories</h3>
              <div className="space-y-3">
                {territories
                  .sort((a, b) => b.achievement - a.achievement)
                  .slice(0, 3)
                  .map((territory, index) => (
                    <div key={territory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{territory.name}</p>
                          <p className="text-sm text-gray-500">{territory.manager}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getAchievementColor(territory.achievement)}`}>
                          {territory.achievement.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          ${(territory.revenue / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Monthly Performance Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trend</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Trend chart visualization would go here</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Territory Hierarchy</h3>
            <div className="space-y-4">
              {/* Root Level */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Global</span>
                </div>
                
                {/* Child Territories */}
                <div className="ml-6 space-y-3">
                  {territories.map((territory) => (
                    <div key={territory.id} className="border-l-2 border-gray-300 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{territory.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {territory.customerCount} customers
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{territory.manager}</span>
                          <Badge variant={getAchievementBadgeVariant(territory.achievement)} className="text-xs">
                            {territory.achievement.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Territory Assignment */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Territory Assignment</h3>
              <Button variant="outline">Bulk Assign</Button>
            </div>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Territory assignment interface would go here</p>
              <p className="text-sm text-gray-400">Drag and drop customers between territories</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerritoryManagement;