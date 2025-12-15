import { useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '@/lib/cache';

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number | undefined>(undefined);
  const mountTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Record mount time
    if (typeof window !== 'undefined' && 'performance' in window && typeof performance.now === 'function') {
      mountTimeRef.current = performance.now();
    }
    
    return () => {
      // Record unmount time
      if (mountTimeRef.current && typeof window !== 'undefined' && 'performance' in window && typeof performance.now === 'function') {
        const mountDuration = performance.now() - mountTimeRef.current;
        performanceMonitor.recordMetric(`${componentName}_mount_duration`, mountDuration);
      }
    };
  }, [componentName]);

  useEffect(() => {
    // Record render completion
    if (renderStartRef.current && typeof window !== 'undefined' && 'performance' in window && typeof performance.now === 'function') {
      const renderDuration = performance.now() - renderStartRef.current;
      performanceMonitor.recordMetric(`${componentName}_render_duration`, renderDuration);
    }
  });

  // Start render timing
  if (typeof window !== 'undefined' && 'performance' in window && typeof performance.now === 'function') {
    renderStartRef.current = performance.now();
  }
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const measureApiCall = <T>(
    apiCall: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const endTimer = performanceMonitor.startTimer(`api_${operationName}`);
    
    return apiCall()
      .finally(() => {
        endTimer();
      });
  };

  return { measureApiCall };
}

// Hook for monitoring page load performance
export function usePagePerformance(pageName: string) {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  }>({});

  useEffect(() => {
    // Measure page load metrics
    const measurePageMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          
          setMetrics(prev => ({
            ...prev,
            loadTime,
            domContentLoaded,
          }));

          // Record metrics
          performanceMonitor.recordMetric(`${pageName}_load_time`, loadTime);
          performanceMonitor.recordMetric(`${pageName}_dom_content_loaded`, domContentLoaded);
        }

        // Measure paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              firstContentfulPaint: entry.startTime,
            }));
            performanceMonitor.recordMetric(`${pageName}_first_contentful_paint`, entry.startTime);
          }
        });

        // Measure LCP
        if ('PerformanceObserver' in window) {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime,
            }));
            performanceMonitor.recordMetric(`${pageName}_largest_contentful_paint`, lastEntry.startTime);
          });

          try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // LCP not supported
          }

          return () => {
            lcpObserver.disconnect();
          };
        }
      }
    };

    // Wait for page to load
    if (document.readyState === 'complete') {
      measurePageMetrics();
    } else {
      window.addEventListener('load', measurePageMetrics);
      return () => window.removeEventListener('load', measurePageMetrics);
    }
  }, [pageName]);

  return metrics;
}

// Hook for monitoring network performance
export function useNetworkPerformance() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({});

  useEffect(() => {
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return networkInfo;
}

// Hook for memory usage monitoring
export function useMemoryPerformance() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Hook for performance budget monitoring
export function usePerformanceBudget(budgets: {
  loadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  memoryUsage?: number;
}) {
  const [violations, setViolations] = useState<string[]>([]);

  const checkBudgets = (metrics: any) => {
    const newViolations: string[] = [];

    if (budgets.loadTime && metrics.loadTime > budgets.loadTime) {
      newViolations.push(`Load time exceeded budget: ${metrics.loadTime}ms > ${budgets.loadTime}ms`);
    }

    if (budgets.firstContentfulPaint && metrics.firstContentfulPaint > budgets.firstContentfulPaint) {
      newViolations.push(`FCP exceeded budget: ${metrics.firstContentfulPaint}ms > ${budgets.firstContentfulPaint}ms`);
    }

    if (budgets.largestContentfulPaint && metrics.largestContentfulPaint > budgets.largestContentfulPaint) {
      newViolations.push(`LCP exceeded budget: ${metrics.largestContentfulPaint}ms > ${budgets.largestContentfulPaint}ms`);
    }

    if (budgets.memoryUsage && metrics.usedJSHeapSize > budgets.memoryUsage) {
      newViolations.push(`Memory usage exceeded budget: ${metrics.usedJSHeapSize} bytes > ${budgets.memoryUsage} bytes`);
    }

    setViolations(newViolations);

    // Log violations
    if (newViolations.length > 0) {
      console.warn('Performance budget violations:', newViolations);
    }
  };

  return { violations, checkBudgets };
}