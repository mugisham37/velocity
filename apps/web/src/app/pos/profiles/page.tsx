'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/di";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Edit,
  Plus,
  Printer,
  Settings,
  Store,
  Trash2,
  Wifi
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
port {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface POSProfile {
  id: string;
  name: string;
  description?: string;
  warehouseId: string;
  warehouseName?: string;
  cashAccount: string;
  incomeAccount: string;
  expenseAccount: string;
  costCenter?: string;
  currency: string;
  priceList?: string;
  allowDiscount: boolean;
  maxDiscount: number;
  allowCreditSale: boolean;
  allowReturn: boolean;
  printReceipt: boolean;
  emailReceipt: boolean;
  offlineMode: boolean;
  loyaltyProgram?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePOSProfileData {
  name: string;
  description?: string;
  warehouseId: string;
  cashAccount: string;
  incomeAccount: string;
  expenseAccount: string;
  costCenter?: string;
  currency: string;
  priceList?: string;
  allowDiscount: boolean;
  maxDiscount: number;
  allowCreditSale: boolean;
  allowReturn: boolean;
  printReceipt: boolean;
  emailReceipt: boolean;
  offlineMode: boolean;
  loyaltyProgram?: string;
}

export default function POSProfilesPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<POSProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<POSProfile | null>(null);
  const [formData, setFormData] = useState<CreatePOSProfileData>({
    name: '',
    description: '',
    warehouseId: '',
    cashAccount: '',
    incomeAccount: '',
    expenseAccount: '',
    costCenter: '',
    currency: 'USD',
    priceList: '',
    allowDiscount: true,
    maxDiscount: 10,
    allowCreditSale: false,
    allowReturn: true,
    printReceipt: true,
    emailReceipt: false,
    offlineMode: false,
    loyaltyProgram: '',
  });

  // Mock data for dropdowns
  const warehouses = [
    { id: 'wh-1', name: 'Main Warehouse' },
    { id: 'wh-2', name: 'Store Warehouse' },
  ];

  const accounts = [
    { id: 'acc-1', name: 'Cash - Main', code: '1001' },
    { id: 'acc-2', name: 'Sales Revenue', code: '4001' },
    { id: 'acc-3', name: 'Cost of Goods Sold', code: '5001' },
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);

      // Mock API call - in real app, this would use GraphQL
      const mockProfiles: POSProfile[] = [
        {
          id: '1',
          name: 'Main Store POS',
          description: 'Primary point of sale for main store',
          warehouseId: 'wh-1',
          warehouseName: 'Main Warehouse',
          cashAccount: 'acc-1',
          incomeAccount: 'acc-2',
          expenseAccount: 'acc-3',
          costCenter: 'Store-001',
          currency: 'USD',
          priceList: 'Standard',
          allowDiscount: true,
          maxDiscount: 15,
          allowCreditSale: false,
          allowReturn: true,
          printReceipt: true,
          emailReceipt: true,
          offlineMode: true,
          loyaltyProgram: 'Standard Loyalty',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: '2',
          name: 'Express Checkout',
          description: 'Quick checkout for small items',
          warehouseId: 'wh-1',
          warehouseName: 'Main Warehouse',
          cashAccount: 'acc-1',
          incomeAccount: 'acc-2',
          expenseAccount: 'acc-3',
          currency: 'USD',
          allowDiscount: false,
          maxDiscount: 0,
          allowCreditSale: false,
          allowReturn: false,
          printReceipt: true,
          emailReceipt: false,
          offlineMode: false,
          isActive: true,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
        },
      ];

      setProfiles(mockProfiles);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load POS profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProfile) {
        // Update existing profile
        const updatedProfile = { ...editingProfile, ...formData, updatedAt: new Date() };
        setProfiles(profiles.map(p => p.id === editingProfile.id ? updatedProfile : p));

        toast({
          title: 'Success',
          description: 'POS profile updated successfully',
        });
      } else {
        // Create new profile
        const newProfile: POSProfile = {
          ...formData,
          id: `profile-${Date.now()}`,
          warehouseName: warehouses.find(w => w.id === formData.warehouseId)?.name,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setProfiles([newProfile, ...profiles]);

        toast({
          title: 'Success',
          description: 'POS profile created successfully',
        });
      }

      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save POS profile',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (profile: POSProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      warehouseId: profile.warehouseId,
      cashAccount: profile.cashAccount,
      incomeAccount: profile.incomeAccount,
      expenseAccount: profile.expenseAccount,
      costCenter: profile.costCenter || '',
      currency: profile.currency,
      priceList: profile.priceList || '',
      allowDiscount: profile.allowDiscount,
      maxDiscount: profile.maxDiscount,
      allowCreditSale: profile.allowCreditSale,
      allowReturn: profile.allowReturn,
      printReceipt: profile.printReceipt,
      emailReceipt: profile.emailReceipt,
      offlineMode: profile.offlineMode,
      loyaltyProgram: profile.loyaltyProgram || '',
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this POS profile?')) {
      return;
    }

    try {
      setProfiles(profiles.filter(p => p.id !== profileId));

      toast({
        title: 'Success',
        description: 'POS profile deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete POS profile',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (profileId: string) => {
    try {
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, isActive: !p.isActive, updatedAt: new Date() } : p
      ));

      toast({
        title: 'Success',
        description: 'POS profile status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      warehouseId: '',
      cashAccount: '',
      incomeAccount: '',
      expenseAccount: '',
      costCenter: '',
      currency: 'USD',
      priceList: '',
      allowDiscount: true,
      maxDiscount: 10,
      allowCreditSale: false,
      allowReturn: true,
      printReceipt: true,
      emailReceipt: false,
      offlineMode: false,
      loyaltyProgram: '',
    });
    setEditingProfile(null);
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading POS profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">POS Profiles</h1>
            <p className="text-gray-600 mt-2">Manage point of sale configurations</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Profile
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProfile ? 'Edit POS Profile' : 'Create POS Profile'}
                </DialogTitle>
                <DialogDescription>
                  Configure the settings for your point of sale system.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Profile Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Warehouse & Accounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Warehouse & Accounts</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warehouse">Warehouse *</Label>
                      <Select
                        value={formData.warehouseId}
                        onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="costCenter">Cost Center</Label>
                      <Input
                        id="costCenter"
                        value={formData.costCenter}
                        onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cashAccount">Cash Account *</Label>
                      <Select
                        value={formData.cashAccount}
                        onValueChange={(value) => setFormData({ ...formData, cashAccount: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="incomeAccount">Income Account *</Label>
                      <Select
                        value={formData.incomeAccount}
                        onValueChange={(value) => setFormData({ ...formData, incomeAccount: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expenseAccount">Expense Account *</Label>
                      <Select
                        value={formData.expenseAccount}
                        onValueChange={(value) => setFormData({ ...formData, expenseAccount: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Pricing & Discounts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pricing & Discounts</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priceList">Price List</Label>
                      <Input
                        id="priceList"
                        value={formData.priceList}
                        onChange={(e) => setFormData({ ...formData, priceList: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="loyaltyProgram">Loyalty Program</Label>
                      <Input
                        id="loyaltyProgram"
                        value={formData.loyaltyProgram}
                        onChange={(e) => setFormData({ ...formData, loyaltyProgram: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowDiscount"
                        checked={formData.allowDiscount}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowDiscount: checked })}
                      />
                      <Label htmlFor="allowDiscount">Allow Discount</Label>
                    </div>

                    {formData.allowDiscount && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="maxDiscount">Max Discount %:</Label>
                        <Input
                          id="maxDiscount"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.maxDiscount}
                          onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Features</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="allowCreditSale"
                          checked={formData.allowCreditSale}
                          onCheckedChange={(checked) => setFormData({ ...formData, allowCreditSale: checked })}
                        />
                        <Label htmlFor="allowCreditSale">Allow Credit Sale</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="allowReturn"
                          checked={formData.allowReturn}
                          onCheckedChange={(checked) => setFormData({ ...formData, allowReturn: checked })}
                        />
                        <Label htmlFor="allowReturn">Allow Returns</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="offlineMode"
                          checked={formData.offlineMode}
                          onCheckedChange={(checked) => setFormData({ ...formData, offlineMode: checked })}
                        />
                        <Label htmlFor="offlineMode">Offline Mode</Label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="printReceipt"
                          checked={formData.printReceipt}
                          onCheckedChange={(checked) => setFormData({ ...formData, printReceipt: checked })}
                        />
                        <Label htmlFor="printReceipt">Print Receipt</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="emailReceipt"
                          checked={formData.emailReceipt}
                          onCheckedChange={(checked) => setFormData({ ...formData, emailReceipt: checked })}
                        />
                        <Label htmlFor="emailReceipt">Email Receipt</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProfile ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    {profile.description && (
                      <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Store className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{profile.warehouseName || 'Warehouse'}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{profile.currency}</span>
                  </div>

                  {profile.loyaltyProgram && (
                    <div className="flex items-center text-sm">
                      <span className="w-4 h-4 mr-2 text-gray-500">🎁</span>
                      <span>{profile.loyaltyProgram}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {profile.allowDiscount && (
                    <Badge variant="outline" className="text-xs">
                      Discount {profile.maxDiscount}%
                    </Badge>
                  )}
                  {profile.allowReturn && (
                    <Badge variant="outline" className="text-xs">Returns</Badge>
                  )}
                  {profile.printReceipt && (
                    <Badge variant="outline" className="text-xs">
                      <Printer className="w-3 h-3 mr-1" />Print
                    </Badge>
                  )}
                  {profile.offlineMode && (
                    <Badge variant="outline" className="text-xs">
                      <Wifi className="w-3 h-3 mr-1" />Offline
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(profile)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(profile.id)}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(profile.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <span className="text-xs text-gray-500">
                    Updated {profile.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No POS Profiles</h3>
            <p className="text-gray-600 mb-4">
              Create your first POS profile to start processing sales.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
