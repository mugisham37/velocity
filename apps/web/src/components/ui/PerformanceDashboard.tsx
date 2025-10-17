// Performance monitoring dashboard for development and production

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  PerformanceMonitor, 
  getMemoryUsage, 
  analyzeBundleSize,
  checkPerformanceBudget,
  getOptimizationRecommendations,
  defaultPerformanceBudget,
  type PerformanceMetrics,
  type WebVitals 
} from '@/lib/utils/performance';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PerformanceDashboard({ isVisible, onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<Partial<WebVitals>>({});
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [budgetCheck, setBudgetCheck] = useState<{ passed: boolean; violations: string[] } | null>(null);
  const performanceMonitor = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    if (isVisible && !performanceMonitor.current) {
      performanceMonitor.current = new PerformanceMonitor();
      
      // Update metrics periodically
      const interval = setInterval(() => {
        if (performanceMonitor.current) {
          const currentMetrics = performanceMonitor.current.getMetrics();
          setMetrics(currentMetrics);
          
          // Update memory usage
          const memory = getMemoryUsage();
          setMemoryUsage(memory);
          
          // Analyze bundle size
          const bundle = analyzeBundleSize();
          setBundleAnalysis(bundle);
          
          // Create performance metrics for budget check
          const perfMetrics: PerformanceMetrics = {
            loadTime: currentMetrics.FCP || 0,
            renderTime: currentMetrics.LCP || 0,
            interactionTime: currentMetrics.FID || 0,
            memoryUsage: memory || 0,
            bundleSize: bundle?.totalSize || 0,
          };
          
          // Check performance budget
          const budget = checkPerformanceBudget(perfMetrics);
          setBudgetCheck(budget);
          
          // Get recommendations
          const recs = getOptimizationRecommendations(perfMetrics);
          setRecommendations(recs);
        }
      }, 2000);
      
      return () => {
        clearInterval(interval);
        if (performanceMonitor.current) {
          performanceMonitor.current.disconnect();
        }
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const formatTime = (time: number | undefined) => 
    time ? `${time.toFixed(2)}ms` : 'N/A';

  const formatSize = (size: number | undefined) => 
    size ? `${size.toFixed(2)}KB` : 'N/A';

  const formatMemory = (memory: number | null) => 
    memory ? `${memory.toFixed(2)}MB` : 'N/A';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Core Web Vitals */}
          <div>
            <h3 className="text-lg font-medium mb-4">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Largest Contentful Paint (LCP)"
                value={formatTime(metrics.LCP)}
                status={getMetricStatus(metrics.LCP, 2500, 4000)}
                description="Loading performance"
              />
              <MetricCard
                title="First Input Delay (FID)"
                value={formatTime(metrics.FID)}
                status={getMetricStatus(metrics.FID, 100, 300)}
                description="Interactivity"
              />
              <MetricCard
                title="Cumulative Layout Shift (CLS)"
                value={metrics.CLS?.toFixed(3) || 'N/A'}
                status={getMetricStatus(metrics.CLS, 0.1, 0.25)}
                description="Visual stability"
              />
            </div>
          </div>

          {/* Additional Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Additional Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="First Contentful Paint (FCP)"
                value={formatTime(metrics.FCP)}
                status={getMetricStatus(metrics.FCP, 1800, 3000)}
                description="First paint time"
              />
              <MetricCard
                title="Time to First Byte (TTFB)"
                value={formatTime(metrics.TTFB)}
                status={getMetricStatus(metrics.TTFB, 800, 1800)}
                description="Server response time"
              />
              <MetricCard
                title="Memory Usage"
                value={formatMemory(memoryUsage)}
                status={getMemoryStatus(memoryUsage)}
                description="JavaScript heap size"
              />
            </div>
          </div>

          {/* Bundle Analysis */}
          {bundleAnalysis && (
            <div>
              <h3 className="text-lg font-medium mb-4">Bundle Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Bundle Size</span>
                    <div className="text-lg font-medium">{formatSize(bundleAnalysis.totalSize)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Resource Count</span>
                    <div className="text-lg font-medium">{bundleAnalysis.resourceCount}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Largest Resources</h4>
                  {bundleAnalysis.resources
                    .sort((a: any, b: any) => b.size - a.size)
                    .slice(0, 5)
                    .map((resource: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate flex-1 mr-2">
                          {resource.name.split('/').pop()}
                        </span>
                        <span className="text-gray-600">
                          {formatSize(resource.size)} ({formatTime(resource.loadTime)})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Budget */}
          {budgetCheck && (
            <div>
              <h3 className="text-lg font-medium mb-4">Performance Budget</h3>
              <div className={`rounded-lg p-4 ${budgetCheck.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${budgetCheck.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">
                    {budgetCheck.passed ? 'Budget Passed' : 'Budget Violations'}
                  </span>
                </div>
                
                {budgetCheck.violations.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {budgetCheck.violations.map((violation, index) => (
                      <li key={index} className="text-red-700">• {violation}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Optimization Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Optimization Recommendations</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Metric card component
function MetricCard({ 
  title, 
  value, 
  status, 
  description 
}: { 
  title: string; 
  value: string; 
  status: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  description: string;
}) {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800',
    'needs-improvement': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    poor: 'bg-red-50 border-red-200 text-red-800',
    unknown: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  const statusIcons = {
    good: '✓',
    'needs-improvement': '⚠',
    poor: '✗',
    unknown: '?',
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <span className="text-lg">{statusIcons[status]}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">{description}</div>
    </div>
  );
}

// Helper functions
function getMetricStatus(
  value: number | undefined, 
  goodThreshold: number, 
  poorThreshold: number
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === undefined) return 'unknown';
  if (value <= goodThreshold) return 'good';
  if (value <= poorThreshold) return 'needs-improvement';
  return 'poor';
}

function getMemoryStatus(memory: number | null): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (memory === null) return 'unknown';
  if (memory <= 30) return 'good';
  if (memory <= 50) return 'needs-improvement';
  return 'poor';
}

// Performance dashboard toggle hook
export function usePerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle performance dashboard
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev),
  };
}