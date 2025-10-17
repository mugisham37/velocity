'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { PaletteIcon } from 'lucide-react';

interface ColorFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function ColorField({ field, error, required, readOnly }: ColorFieldProps) {
  const { register, setValue, watch } = useFormContext();
  const [showPicker, setShowPicker] = useState(false);
  
  const value = watch(field.fieldname) || '#000000';

  // Predefined color palette
  const colorPalette = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
    '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF', '#FFB366', '#B366FF',
    '#66FFB3', '#B3FF66', '#66B3FF', '#FFB366', '#FF6666', '#66FF66', '#6666FF', '#FFFF66',
  ];

  const handleColorChange = (color: string) => {
    setValue(field.fieldname, color, { shouldDirty: true });
    setShowPicker(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setValue(field.fieldname, color, { shouldDirty: true });
  };

  const isValidHex = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.fieldname}
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      <div className="flex items-center space-x-2">
        {/* Color preview */}
        <div
          className={cn(
            'w-10 h-10 rounded-md border-2 border-gray-300 cursor-pointer',
            readOnly && 'cursor-not-allowed opacity-50'
          )}
          style={{ backgroundColor: isValidHex(value) ? value : '#000000' }}
          onClick={() => !readOnly && setShowPicker(!showPicker)}
          title="Click to open color picker"
        />
        
        {/* Text input */}
        <div className="flex-1 relative">
          <input
            id={field.fieldname}
            type="text"
            {...register(field.fieldname)}
            onChange={handleInputChange}
            placeholder="#000000"
            readOnly={readOnly}
            className={cn(
              'block w-full rounded-md border-gray-300 shadow-sm',
              'focus:border-blue-500 focus:ring-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              readOnly && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              'text-sm pl-3 pr-10 py-2 border font-mono'
            )}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <PaletteIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Native color input */}
        <input
          type="color"
          value={isValidHex(value) ? value : '#000000'}
          onChange={(e) => handleColorChange(e.target.value)}
          disabled={readOnly}
          className={cn(
            'w-10 h-10 rounded-md border border-gray-300 cursor-pointer',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          title="Native color picker"
        />
      </div>
      
      {/* Color palette */}
      {showPicker && !readOnly && (
        <div className="mt-2 p-3 border border-gray-300 rounded-md bg-white shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                className={cn(
                  'w-8 h-8 rounded border-2 hover:scale-110 transition-transform',
                  value === color ? 'border-blue-500' : 'border-gray-300'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close palette
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Color info */}
      {value && isValidHex(value) && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Hex: {value.toUpperCase()}</div>
          <div>
            RGB: {
              value.length === 7 
                ? `${parseInt(value.slice(1, 3), 16)}, ${parseInt(value.slice(3, 5), 16)}, ${parseInt(value.slice(5, 7), 16)}`
                : 'Invalid'
            }
          </div>
        </div>
      )}
    </div>
  );
}