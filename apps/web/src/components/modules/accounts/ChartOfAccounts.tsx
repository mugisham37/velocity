'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { Account, AccountTreeNode, ChartOfAccountsState } from '@/types/accounts';
import { apiClient } from '@/lib/api/client';
import { useNotifications } from '@/hooks/useNotifications';

interface ChartOfAccountsProps {
  company?: string;
  onAccountSelect?: (account: Account) => void;
  readOnly?: boolean;
}

// Build hierarchical tree structure
const buildAccountTree = (accounts: Account[], expandedNodes: Set<string>): AccountTreeNode[] => {
  const accountMap = new Map<string, AccountTreeNode>();
  const rootAccounts: AccountTreeNode[] = [];

  // Create nodes for all accounts
  accounts.forEach(account => {
    const node: AccountTreeNode = {
      ...account,
      children: [],
      level: 0,
      expanded: expandedNodes.has(account.name),
      hasChildren: account.is_group,
    };
    accountMap.set(account.name, node);
  });

  // Build tree structure
  accounts.forEach(account => {
    const node = accountMap.get(account.name)!;
    
    if (account.parent_account) {
      const parent = accountMap.get(account.parent_account);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      }
    } else {
      rootAccounts.push(node);
    }
  });

  return rootAccounts;
};

export function ChartOfAccounts({ 
  company, 
  onAccountSelect, 
  readOnly = false 
}: ChartOfAccountsProps) {
  const [state, setState] = useState<ChartOfAccountsState>({
    accounts: [],
    expandedNodes: new Set(),
    searchQuery: '',
    filters: { company },
    isLoading: true,
    isDragging: false,
  });

  const { showError, showSuccess, showInfo } = useNotifications();

  // Load accounts data
  const loadAccounts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const filters: Record<string, unknown> = {
        company: state.filters.company || company,
      };

      if (state.filters.rootType) {
        filters.root_type = state.filters.rootType;
      }
      if (state.filters.accountType) {
        filters.account_type = state.filters.accountType;
      }
      if (state.filters.isGroup !== undefined) {
        filters.is_group = state.filters.isGroup;
      }
      if (state.filters.disabled !== undefined) {
        filters.disabled = state.filters.disabled;
      }

      const response = await apiClient.getList<Account>('Account', {
        fields: [
          'name', 'account_name', 'account_number', 'account_type', 'root_type',
          'parent_account', 'is_group', 'company', 'account_currency', 'balance',
          'balance_in_account_currency', 'lft', 'rgt', 'disabled', 'freeze_account'
        ],
        filters,
        order_by: 'lft asc',
        limit_page_length: 1000,
      });

      const accountsTree = buildAccountTree(response.data, state.expandedNodes);
      setState(prev => ({ 
        ...prev, 
        accounts: accountsTree, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to load accounts:', error);
      showError('Failed to load chart of accounts');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.filters, state.expandedNodes, company, showError]);


  // Filter accounts based on search query
  const filteredAccounts = useMemo(() => {
    if (!state.searchQuery.trim()) {
      return state.accounts;
    }

    const query = state.searchQuery.toLowerCase();
    
    const filterNode = (node: AccountTreeNode): AccountTreeNode | null => {
      const matches = 
        node.account_name.toLowerCase().includes(query) ||
        node.name.toLowerCase().includes(query) ||
        (node.account_number && node.account_number.toLowerCase().includes(query));

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter(Boolean) as AccountTreeNode[];

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          expanded: true, // Auto-expand when searching
        };
      }

      return null;
    };

    return state.accounts
      .map(node => filterNode(node))
      .filter(Boolean) as AccountTreeNode[];
  }, [state.accounts, state.searchQuery]);

  // Toggle node expansion
  const toggleNode = useCallback((accountName: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedNodes);
      if (newExpanded.has(accountName)) {
        newExpanded.delete(accountName);
      } else {
        newExpanded.add(accountName);
      }
      return { ...prev, expandedNodes: newExpanded };
    });
  }, []);

  // Handle account selection
  const handleAccountSelect = useCallback((account: Account) => {
    setState(prev => ({ ...prev, selectedAccount: account }));
    onAccountSelect?.(account);
  }, [onAccountSelect]);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, account: Account) => {
    if (readOnly) return;
    
    e.dataTransfer.setData('text/plain', account.name);
    setState(prev => ({ 
      ...prev, 
      isDragging: true, 
      draggedAccount: account 
    }));
  }, [readOnly]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetAccount: Account) => {
    e.preventDefault();
    
    if (readOnly || !state.draggedAccount) return;

    try {
      const draggedAccountName = e.dataTransfer.getData('text/plain');
      
      if (draggedAccountName === targetAccount.name || 
          !targetAccount.is_group ||
          draggedAccountName === targetAccount.parent_account) {
        return;
      }

      // Update account parent
      await apiClient.saveDoc('Account', {
        name: draggedAccountName,
        parent_account: targetAccount.name,
      });

      showSuccess('Account moved successfully');
      loadAccounts();
    } catch (error) {
      console.error('Failed to move account:', error);
      showError('Failed to move account');
    } finally {
      setState(prev => ({ 
        ...prev, 
        isDragging: false, 
        draggedAccount: undefined 
      }));
    }
  }, [readOnly, state.draggedAccount, showSuccess, showError, loadAccounts]);

  // Create new account
  const handleCreateAccount = useCallback(async (_parentAccount?: string) => {
    if (readOnly) return;
    
    // This would typically open a modal or navigate to account creation form
    // For now, we'll just show a notification
    showInfo('Account creation form would open here');
  }, [readOnly, showInfo]);

  // Edit account
  const handleEditAccount = useCallback(async (account: Account) => {
    if (readOnly) return;
    
    // This would typically open a modal or navigate to account edit form
    showInfo(`Edit account: ${account.account_name}`);
  }, [readOnly, showInfo]);

  // Delete account
  const handleDeleteAccount = useCallback(async (account: Account) => {
    if (readOnly) return;
    
    if (!confirm(`Are you sure you want to delete account "${account.account_name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteDoc('Account', account.name);
      showSuccess('Account deleted successfully');
      loadAccounts();
    } catch (error) {
      console.error('Failed to delete account:', error);
      showError('Failed to delete account');
    }
  }, [readOnly, showSuccess, showError, loadAccounts]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Render account node
  const renderAccountNode = (node: AccountTreeNode): React.ReactNode => {
    const isSelected = state.selectedAccount?.name === node.name;
    const hasBalance = node.balance !== undefined && node.balance !== 0;
    const isExpanded = node.expanded || state.expandedNodes.has(node.name);

    return (
      <div key={node.name} className="select-none">
        <div
          className={`
            flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
            ${state.isDragging && state.draggedAccount?.name === node.name ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${12 + node.level * 20}px` }}
          onClick={() => handleAccountSelect(node)}
          draggable={!readOnly && !node.is_group}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            {node.hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.name);
                }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
          </div>

          {/* Account Icon */}
          <div className={`w-3 h-3 rounded-full mr-3 ${
            node.is_group ? 'bg-blue-500' : 'bg-green-500'
          }`} />

          {/* Account Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    node.is_group ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {node.account_name}
                  </span>
                  {node.account_number && (
                    <span className="text-sm text-gray-500">
                      ({node.account_number})
                    </span>
                  )}
                  {node.disabled && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Disabled
                    </span>
                  )}
                  {node.freeze_account && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Frozen
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {node.account_type} • {node.root_type}
                </div>
              </div>

              {/* Balance */}
              {hasBalance && !state.filters.showZeroBalance && (
                <div className="text-right">
                  <div className={`font-medium ${
                    node.balance! > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: node.account_currency || 'USD',
                    }).format(Math.abs(node.balance!))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {node.balance! > 0 ? 'Dr' : 'Cr'}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!readOnly && (
                <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100">
                  {node.is_group && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateAccount(node.name);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Add child account"
                    >
                      <PlusIcon className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAccount(node);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Edit account"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  {!node.is_group && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(node);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Delete account"
                    >
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderAccountNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Chart of Accounts
          </h2>
          {!readOnly && (
            <button
              onClick={() => handleCreateAccount()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Account
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Button */}
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>

          {/* Sort Button */}
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
            Sort
          </button>
        </div>
      </div>

      {/* Account Tree */}
      <div className="flex-1 overflow-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {state.searchQuery ? 'No accounts found matching your search' : 'No accounts found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAccounts.map(node => renderAccountNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}