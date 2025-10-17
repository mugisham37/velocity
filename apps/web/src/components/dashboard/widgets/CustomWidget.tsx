'use client';

import React, { useState, useEffect } from 'react';
import type { CustomWidgetConfig } from '@/types/dashboard';

interface CustomWidgetProps {
  config: CustomWidgetConfig;
}

export function CustomWidget({ config }: CustomWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [CustomComponent, setCustomComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    loadCustomComponent();
  }, [config.component]);

  const loadCustomComponent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would dynamically import the custom component
      // For now, we'll simulate loading and show a placeholder
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock component registry
      const componentRegistry: Record<string, React.ComponentType<any>> = {
        'SampleWidget': SampleCustomWidget,
        'HTMLWidget': HTMLCustomWidget,
        'IFrameWidget': IFrameCustomWidget,
      };

      const Component = componentRegistry[config.component];
      
      if (Component) {
        setCustomComponent(() => Component);
      } else {
        throw new Error(`Component "${config.component}" not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom component');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading custom widget...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-red-600">Error loading widget</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!CustomComponent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Custom widget not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-widget h-full">
      <CustomComponent {...config.props} />
    </div>
  );
}

// Sample custom widget components for demonstration
function SampleCustomWidget(props: any) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-2">🎨</div>
        <h3 className="text-lg font-semibold text-gray-900">Sample Custom Widget</h3>
        <p className="text-sm text-gray-600 mt-1">
          This is a custom widget component
        </p>
        {props.message && (
          <p className="text-xs text-blue-600 mt-2 font-medium">
            {props.message}
          </p>
        )}
      </div>
    </div>
  );
}

function HTMLCustomWidget(props: any) {
  const { html = '<p>No HTML content provided</p>' } = props;

  return (
    <div className="h-full overflow-auto">
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function IFrameCustomWidget(props: any) {
  const { src, title = 'Custom Content' } = props;

  if (!src) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No URL provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0 rounded"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export default CustomWidget;