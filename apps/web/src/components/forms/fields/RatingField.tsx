'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { StarIcon } from 'lucide-react';

interface RatingFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function RatingField({ field, error, required, readOnly }: RatingFieldProps) {
  const { setValue, watch } = useFormContext();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const value = watch(field.fieldname) || 0;
  const maxRating = field.options ? parseInt(field.options) : 5;

  const handleRatingClick = (rating: number) => {
    if (readOnly) return;
    setValue(field.fieldname, rating, { shouldDirty: true });
  };

  const handleRatingHover = (rating: number | null) => {
    if (readOnly) return;
    setHoverRating(rating);
  };

  const displayRating = hoverRating !== null ? hoverRating : value;

  return (
    <div className="space-y-1">
      <label
        className={cn(
          'block text-sm font-medium text-gray-700',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {field.label}
      </label>
      
      <div className="flex items-center space-x-2">
        {/* Star rating */}
        <div 
          className="flex items-center space-x-1"
          onMouseLeave={() => handleRatingHover(null)}
        >
          {Array.from({ length: maxRating }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= displayRating;
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleRatingClick(starValue)}
                onMouseEnter={() => handleRatingHover(starValue)}
                disabled={readOnly}
                className={cn(
                  'transition-colors duration-150',
                  readOnly && 'cursor-not-allowed',
                  !readOnly && 'hover:scale-110 transform transition-transform'
                )}
              >
                <StarIcon
                  className={cn(
                    'h-6 w-6',
                    isFilled 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300',
                    !readOnly && 'hover:text-yellow-300'
                  )}
                />
              </button>
            );
          })}
        </div>
        
        {/* Rating text */}
        <span className="text-sm text-gray-600">
          {value > 0 ? `${value}/${maxRating}` : 'No rating'}
        </span>
        
        {/* Clear rating button */}
        {value > 0 && !readOnly && (
          <button
            type="button"
            onClick={() => handleRatingClick(0)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Rating labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Poor</span>
        {maxRating >= 3 && <span>Average</span>}
        <span>Excellent</span>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Rating description */}
      {value > 0 && (
        <p className="text-xs text-gray-600">
          {getRatingDescription(value, maxRating)}
        </p>
      )}
    </div>
  );
}

function getRatingDescription(rating: number, maxRating: number): string {
  const percentage = (rating / maxRating) * 100;
  
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Above Average';
  if (percentage >= 50) return 'Average';
  if (percentage >= 40) return 'Below Average';
  if (percentage >= 30) return 'Poor';
  return 'Very Poor';
}