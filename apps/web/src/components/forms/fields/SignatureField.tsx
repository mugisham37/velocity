'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { cn } from '@/lib/utils';
import { PenToolIcon, RotateCcwIcon, DownloadIcon, XIcon } from 'lucide-react';

interface SignatureFieldProps {
  field: DocField;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function SignatureField({ field, error, required, readOnly }: SignatureFieldProps) {
  const { setValue, watch } = useFormContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const value = watch(field.fieldname);

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasSignature(true);
        };
        img.src = value;
      }
    }
  }, [value]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    setValue(field.fieldname, dataURL, { shouldDirty: true });
  };

  const clearSignature = () => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setValue(field.fieldname, '', { shouldDirty: true });
      setHasSignature(false);
    }
  };

  const downloadSignature = () => {
    if (!value) return;
    
    const link = document.createElement('a');
    link.download = `${field.fieldname}_signature.png`;
    link.href = value;
    link.click();
  };

  // Touch events for mobile support
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    stopDrawing();
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

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
      
      <div className={cn(
        'border-2 border-dashed border-gray-300 rounded-lg overflow-hidden',
        error && 'border-red-300',
        readOnly && 'bg-gray-50'
      )}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            'w-full h-48 bg-white cursor-crosshair',
            readOnly && 'cursor-not-allowed bg-gray-50'
          )}
          style={{ touchAction: 'none' }}
        />
        
        {/* Placeholder text */}
        {!hasSignature && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <PenToolIcon className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Sign here</p>
            </div>
          </div>
        )}
        
        {!hasSignature && readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <p className="text-sm">No signature</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={clearSignature}
              disabled={!hasSignature}
              className={cn(
                'flex items-center space-x-1 px-3 py-1 text-sm rounded',
                'border border-gray-300 hover:bg-gray-50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RotateCcwIcon className="h-4 w-4" />
              <span>Clear</span>
            </button>
            
            {hasSignature && (
              <button
                type="button"
                onClick={downloadSignature}
                className="flex items-center space-x-1 px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            {hasSignature ? 'Signature captured' : 'Draw your signature above'}
          </p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {field.options && (
        <p className="text-xs text-gray-500">{field.options}</p>
      )}
    </div>
  );
}