'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Grid, List, Filter } from 'lucide-react';
import { usePOSStore } from '@/stores/pos';
import { Item } from '@/types/stock';

interface ProductGridProps {
  viewMode?: 'grid' | 'list';
}

export function ProductGrid({ viewMode = 'grid' }: ProductGridProps) {
  const store = usePOSStore();
  const items = store.items as Item[];
  const itemGroups = store.itemGroups as import('@/types/stock').ItemGroup[];
  const loadItems = store.loadItems;
  const addItemToCart = store.addItemToCart;
  const searchItems = store.searchItems;
  const currentProfile = store.currentProfile as import('@/types/pos').POSProfile | null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  useEffect(() => {
    const initializeItems = async () => {
      if (currentProfile) {
        setIsLoading(true);
        try {
          await loadItems();
        } catch (error) {
          console.error('Failed to load items:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeItems();
  }, [currentProfile, loadItems]);

  useEffect(() => {
    let filtered = items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by item group
    if (selectedGroup) {
      filtered = filtered.filter(item => item.item_group === selectedGroup);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedGroup]);

  const handleAddToCart = async (item: Item) => {
    try {
      await addItemToCart(item, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      try {
        await searchItems(term);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between">
          {/* Item Group Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {itemGroups.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.item_group_name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <Button
              variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('grid')}
              className="p-2"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      <div className="flex-1 overflow-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-12 h-12 mb-2" />
            <p>No products found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search or filters</p>
            )}
          </div>
        ) : currentViewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.name}
                item={item}
                onAddToCart={() => handleAddToCart(item)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <ProductListItem
                key={item.name}
                item={item}
                onAddToCart={() => handleAddToCart(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  item: Item;
  onAddToCart: () => void;
}

function ProductCard({ item, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div onClick={onAddToCart} className="space-y-2">
        {/* Product Image Placeholder */}
        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.item_name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <Package className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
            {item.item_name}
          </h4>
          <p className="text-xs text-gray-500">{item.item_code}</p>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-600">
              ₹{item.standard_rate?.toFixed(2) || '0.00'}
            </span>
            {item.stock_qty !== undefined && (
              <span className="text-xs text-gray-500">
                Stock: {item.stock_qty}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductListItemProps {
  item: Item;
  onAddToCart: () => void;
}

function ProductListItem({ item, onAddToCart }: ProductListItemProps) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onAddToCart}
    >
      <div className="flex items-center space-x-3">
        {/* Product Image */}
        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.item_name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{item.item_name}</h4>
          <p className="text-sm text-gray-500">{item.item_code}</p>
        </div>

        {/* Price and Stock */}
        <div className="text-right flex-shrink-0">
          <div className="font-semibold text-blue-600">
            ₹{item.standard_rate?.toFixed(2) || '0.00'}
          </div>
          {item.stock_qty !== undefined && (
            <div className="text-xs text-gray-500">
              Stock: {item.stock_qty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}