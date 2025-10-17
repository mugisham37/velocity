'use client';

import React from 'react';
import type { NumberCardConfig, NumberCardData } from '@/types/dashboard';

interface NumberCardWidgetProps {
  config: NumberCardConfig;
  data: NumberCardData;
  onClick?: () => void;
}

export function NumberCardWidget({ config, data, onClick }: NumberCardWidgetProps) {
  const { display, trend } = config;

  const formatValue = (value: number) => {
    const { format, decimals, prefix, suffix } = display;
    
    let formattedValue: string;
    
    switch (format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;
      case 'percentage':
        formattedValue = `${value.toFixed(decimals)}%`;
        break;
      default:
        formattedValue = value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
    }

    return `${prefix || ''}${formattedValue}${suffix || ''}`;
  };

  const getTrendColor = () => {
    if (!data.trend) return 'text-gray-500';
    
    switch (data.trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    if (!data.trend || !trend.showArrow) return null;
    
    switch (data.trend.direction) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={`number-card-widget h-full flex flex-col justify-center p-4 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
      style={{ backgroundColor: display.color ? `${display.color}10` : undefined }}
    >
      {/* Icon */}
      {display.icon && (
        <div className="flex justify-center mb-2">
          <span className="text-2xl">{display.icon}</span>
        </div>
      )}

      {/* Main Value */}
      <div className="text-center">
        <div 
          className="text-3xl font-bold leading-none"
          style={{ color: display.color || '#1f2937' }}
        >
          {formatValue(data.value)}
        </div>

        {/* Trend Information */}
        {trend.enabled && data.trend && (
          <div className={`flex items-center justify-center mt-2 text-sm ${getTrendColor()}`}>
            {trend.showArrow && getTrendIcon()}
            <span className="ml-1">
              {trend.showPercentage && `${Math.abs(data.trend.percentage).toFixed(1)}%`}
              {trend.showPercentage && data.trend.value && ' • '}
              {data.trend.value && formatValue(Math.abs(data.trend.value))}
            </span>
          </div>
        )}

        {/* Period Information */}
        {trend.enabled && (
          <div className="text-xs text-gray-500 mt-1">
            vs last {trend.period}
          </div>
        )}
      </div>
    </div>
  );
}

export default NumberCardWidget;