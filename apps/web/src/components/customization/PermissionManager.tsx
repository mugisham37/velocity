'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '@/hooks/useNotifications';

// Permission levels
export interface PermissionLevel {
  level: number;
  name: string;
  description?: string;
}

// Role permission interface
export interface RolePermission {
  role: string;
  permlevel: number;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
  amend: boolean;
  report: boolean;
  export: boolean;
  import: boolean;
  share: boolean;
  print: boolean;
  email: boolean;
  if_owner: boolean;
  match?: string; // User permission condition
}

// DocType permission interface
export interface DocTypePermission {
  doctype: string;
  permissions: RolePermission[];
  permission_levels: PermissionLevel[];
  user_permissions: UserPermission[];
}

// User permission interface
export interface UserPermission {
  user: string;
  allow: string;
  for_value: string;
  applicable_for?: string;
  is_default?: boolean;
}

interface PermissionManagerProps {
  doctype: string;
  onBack?: () => void;
}

// Common roles in ERPNext
const COMMON_ROLES = [
  'Administrator',
  'System Manager',
  'All',
  'Guest',
  'Sales User',
  'Sales Manager',
  'Sales Master Manager',
  'Purchase User',
  'Purchase Manager',
  'Purchase Master Manager',
  'Accounts User',
  'Accounts Manager',
  'Stock User',
  'Stock Manager',
  'Manufacturing User',
  'Manufacturing Manager',
  'HR User',
  'HR Manager',
  'Projects User',
  'Projects Manager',
  'Website Manager',
  'Blogger',
  'Customer',
  'Supplier',
  'Employee',
  'Employee Self Service',
];

// Permission validation schema
const rolePermissionSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  permlevel: z.number().min(0).max(9),
  read: z.boolean(),
  write: z.boolean(),
  create: z.boolean(),
  delete: z.boolean(),
  submit: z.boolean(),
  cancel: z.boolean(),
  amend: z.boolean(),
  report: z.boolean(),
  export: z.boolean(),
  import: z.boolean(),
  share: z.boolean(),
  print: z.boolean(),
  email: z.boolean(),
  if_owner: z.boolean(),
  match: z.string().optional(),
});

type RolePermissionFormData = z.infer<typeof rolePermissionSchema>;

export function PermissionManager({ doctype, onBack }: PermissionManagerProps): React.JSX.Element {
  const [permissions, setPermissions] = useState<DocTypePermission>({
    doctype,
    permissions: [],
    permission_levels: [
      { level: 0, name: 'Level 0', description: 'Default permission level' },
    ],
    user_permissions: [],
  });
  
  const [editingPermission, setEditingPermission] = useState<RolePermission | null>(null);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Load permissions data
  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      
      try {
        // Simulate API call - in real implementation, this would fetch from Frappe
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock permissions data
        const mockPermissions: DocTypePermission = {
          doctype,
          permissions: [
            {
              role: 'Administrator',
              permlevel: 0,
              read: true,
              write: true,
              create: true,
              delete: true,
              submit: true,
              cancel: true,
              amend: true,
              report: true,
              export: true,
              import: true,
              share: true,
              print: true,
              email: true,
              if_owner: false,
            },
            {
              role: 'System Manager',
              permlevel: 0,
              read: true,
              write: true,
              create: true,
              delete: true,
              submit: true,
              cancel: true,
              amend: true,
              report: true,
              export: true,
              import: true,
              share: true,
              print: true,
              email: true,
              if_owner: false,
            },
            {
              role: 'Sales User',
              permlevel: 0,
              read: true,
              write: true,
              create: true,
              delete: false,
              submit: false,
              cancel: false,
              amend: false,
              report: true,
              export: true,
              import: false,
              share: false,
              print: true,
              email: true,
              if_owner: true,
            },
            {
              role: 'Sales Manager',
              permlevel: 0,
              read: true,
              write: true,
              create: true,
              delete: true,
              submit: true,
              cancel: true,
              amend: true,
              report: true,
              export: true,
              import: true,
              share: true,
              print: true,
              email: true,
              if_owner: false,
            },
          ],
          permission_levels: [
            { level: 0, name: 'Level 0', description: 'Default permission level' },
            { level: 1, name: 'Level 1', description: 'Restricted fields' },
          ],
          user_permissions: [
            {
              user: 'sales@example.com',
              allow: 'Territory',
              for_value: 'North',
              is_default: true,
            },
            {
              user: 'manager@example.com',
              allow: 'Company',
              for_value: 'Test Company',
              is_default: true,
            },
          ],
        };
        
        setPermissions(mockPermissions);
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Load Failed',
          message: 'Failed to load permissions. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [doctype, addNotification]);

  // Permission form
  const form = useForm<RolePermissionFormData>({
    resolver: zodResolver(rolePermissionSchema),
    defaultValues: {
      permlevel: 0,
      read: false,
      write: false,
      create: false,
      delete: false,
      submit: false,
      cancel: false,
      amend: false,
      report: false,
      export: false,
      import: false,
      share: false,
      print: false,
      email: false,
      if_owner: false,
    },
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  // Add new permission
  const addPermission = () => {
    setEditingPermission(null);
    reset();
    setShowPermissionForm(true);
  };

  // Edit permission
  const editPermission = (permission: RolePermission) => {
    setEditingPermission(permission);
    reset(permission);
    setShowPermissionForm(true);
  };

  // Save permission
  const savePermission = async (data: RolePermissionFormData) => {
    try {
      // Check if role already exists at this permission level
      const existingIndex = permissions.permissions.findIndex(
        p => p.role === data.role && p.permlevel === data.permlevel
      );
      
      if (existingIndex >= 0 && !editingPermission) {
        addNotification({
          type: 'error',
          title: 'Permission Exists',
          message: `Permission for role "${data.role}" at level ${data.permlevel} already exists.`,
        });
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newPermission: RolePermission = { ...data };
      
      if (editingPermission) {
        // Update existing permission
        setPermissions(prev => ({
          ...prev,
          permissions: prev.permissions.map(p => 
            p.role === editingPermission.role && p.permlevel === editingPermission.permlevel
              ? newPermission
              : p
          ),
        }));
        
        addNotification({
          type: 'success',
          title: 'Permission Updated',
          message: `Permission for role "${data.role}" has been updated.`,
        });
      } else {
        // Add new permission
        setPermissions(prev => ({
          ...prev,
          permissions: [...prev.permissions, newPermission],
        }));
        
        addNotification({
          type: 'success',
          title: 'Permission Added',
          message: `Permission for role "${data.role}" has been added.`,
        });
      }
      
      setShowPermissionForm(false);
      setEditingPermission(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save permission. Please try again.',
      });
    }
  };

  // Delete permission
  const deletePermission = async (permission: RolePermission) => {
    if (!confirm(`Are you sure you want to delete permission for role "${permission.role}"?`)) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPermissions(prev => ({
        ...prev,
        permissions: prev.permissions.filter(
          p => !(p.role === permission.role && p.permlevel === permission.permlevel)
        ),
      }));
      
      addNotification({
        type: 'success',
        title: 'Permission Deleted',
        message: `Permission for role "${permission.role}" has been deleted.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete permission. Please try again.',
      });
    }
  };

  // Toggle permission property
  const togglePermission = async (permission: RolePermission, property: keyof RolePermission) => {
    if (typeof permission[property] !== 'boolean') return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setPermissions(prev => ({
        ...prev,
        permissions: prev.permissions.map(p => 
          p.role === permission.role && p.permlevel === permission.permlevel
            ? { ...p, [property]: !p[property] }
            : p
        ),
      }));
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update permission. Please try again.',
      });
    }
  };

  // Filter permissions by level
  const filteredPermissions = permissions.permissions.filter(p => p.permlevel === selectedLevel);

  // Permission properties for display
  const permissionProperties = [
    { key: 'read', label: 'Read', icon: EyeIcon, color: 'text-blue-600' },
    { key: 'write', label: 'Write', icon: PencilIcon, color: 'text-green-600' },
    { key: 'create', label: 'Create', icon: PlusIcon, color: 'text-purple-600' },
    { key: 'delete', label: 'Delete', icon: TrashIcon, color: 'text-red-600' },
    { key: 'submit', label: 'Submit', icon: CheckCircleIcon, color: 'text-indigo-600' },
    { key: 'cancel', label: 'Cancel', icon: ExclamationTriangleIcon, color: 'text-yellow-600' },
    { key: 'amend', label: 'Amend', icon: DocumentTextIcon, color: 'text-gray-600' },
    { key: 'report', label: 'Report', icon: DocumentTextIcon, color: 'text-cyan-600' },
    { key: 'export', label: 'Export', icon: DocumentTextIcon, color: 'text-orange-600' },
    { key: 'import', label: 'Import', icon: DocumentTextIcon, color: 'text-pink-600' },
    { key: 'share', label: 'Share', icon: UserGroupIcon, color: 'text-teal-600' },
    { key: 'print', label: 'Print', icon: DocumentTextIcon, color: 'text-slate-600' },
    { key: 'email', label: 'Email', icon: DocumentTextIcon, color: 'text-violet-600' },
  ];

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading permissions...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permission Manager</h1>
              <p className="text-sm text-gray-600">
                Manage role-based permissions for <span className="font-medium">{doctype}</span>
              </p>
            </div>
          </div>
          
          <Button onClick={addPermission}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        </div>
      </Card>

      {/* Permission Levels */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Permission Levels</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {permissions.permission_levels.map((level) => (
                <option key={level.level} value={level.level}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {permissions.permission_levels.find(l => l.level === selectedLevel)?.description}
        </div>
      </Card>

      {/* Permissions Table */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Role Permissions (Level {selectedLevel})
        </h3>
        
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-2" />
            <p>No permissions defined for this level.</p>
            <Button className="mt-4" onClick={addPermission}>
              Add First Permission
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {permissionProperties.map((prop) => (
                    <th key={prop.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col items-center space-y-1">
                        <prop.icon className={`h-4 w-4 ${prop.color}`} />
                        <span>{prop.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    If Owner
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermissions.map((permission) => (
                  <tr key={`${permission.role}-${permission.permlevel}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {permission.role}
                          </div>
                          {permission.match && (
                            <div className="text-xs text-gray-500">
                              Match: {permission.match}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {permissionProperties.map((prop) => (
                      <td key={prop.key} className="px-3 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => togglePermission(permission, prop.key as keyof RolePermission)}
                          className={`p-1 rounded-full transition-colors ${
                            permission[prop.key as keyof RolePermission]
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {permission[prop.key as keyof RolePermission] ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-current" />
                          )}
                        </button>
                      </td>
                    ))}
                    
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePermission(permission, 'if_owner')}
                        className={`p-1 rounded-full transition-colors ${
                          permission.if_owner
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {permission.if_owner ? (
                          <LockClosedIcon className="h-4 w-4" />
                        ) : (
                          <LockOpenIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editPermission(permission)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePermission(permission)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Permission Form Modal */}
      {showPermissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPermission ? 'Edit Permission' : 'Add Permission'}
            </h3>
            
            <form onSubmit={handleSubmit(savePermission)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    {...register('role')}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.role ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select Role</option>
                    {COMMON_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Level
                  </label>
                  <select
                    {...register('permlevel', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {permissions.permission_levels.map((level) => (
                      <option key={level.level} value={level.level}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Condition (Optional)
                </label>
                <Input
                  {...register('match')}
                  placeholder="e.g., company:company"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Restrict access based on field values (format: field:value)
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {permissionProperties.map((prop) => (
                    <label key={prop.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register(prop.key as keyof RolePermissionFormData)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{prop.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('if_owner')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Apply only if user is owner</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Restrict permissions to documents created by the user
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPermissionForm(false);
                    setEditingPermission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPermission ? 'Update Permission' : 'Add Permission'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}