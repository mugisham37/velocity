'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Scan, Search } from 'lucide-react';
import { usePOSStore } from '@/stores/pos';

export function BarcodeScanner() {
  const { addItemToCart, searchItems } = usePOSStore();
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the barcode input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus barcode input when F2 is pressed or when typing starts
      if (event.key === 'F2' || (
        !event.ctrlKey && 
        !event.altKey && 
        event.key.length === 1 && 
        document.activeElement?.tagName !== 'INPUT'
      )) {
        event.preventDefault();
        inputRef.current?.focus();
        if (event.key !== 'F2') {
          setScanInput(event.key);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    setIsScanning(true);
    try {
      // First try to find item by barcode
      const items = await searchItems(barcode, { searchBy: 'barcode' });
      
      if (items.length > 0) {
        // Add first matching item to cart
        await addItemToCart(items[0], 1);
        setScanInput('');
      } else {
        // If no barcode match, try searching by item code or name
        const searchResults = await searchItems(barcode);
        if (searchResults.length === 1) {
          await addItemToCart(searchResults[0], 1);
          setScanInput('');
        } else if (searchResults.length > 1) {
          // Multiple matches - could show a selection dialog
          console.log('Multiple items found:', searchResults);
        } else {
          // No matches found
          console.log('No items found for:', barcode);
        }
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleScan(scanInput);
    }
  };

  const handleManualScan = () => {
    handleScan(scanInput);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Scan barcode or search item (F2 to focus)"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4 py-2"
          disabled={isScanning}
        />
        {isScanning && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      <Button
        onClick={handleManualScan}
        disabled={!scanInput.trim() || isScanning}
        variant="outline"
        size="sm"
        className="flex items-center space-x-1"
      >
        <Search className="w-4 h-4" />
        <span>Search</span>
      </Button>
    </div>
  );
}