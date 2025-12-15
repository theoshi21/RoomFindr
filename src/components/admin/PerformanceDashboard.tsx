'use client';

import React, { useState, useEffect } from 'react';
import { performanceMonitor, memoryCache } from '@/lib/cache';
import { useMemoryPerformance, useNetworkPerformance } from '@/hooks/usePerformance';

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [cacheStats, setCacheStats] = useState<any>({});
  const memoryInfo = useMemoryPerformance();
  const networkInfo = useNetworkPerformance();

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getAllMetrics());
      setCacheStats(memoryCache.getStats());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics).map(([label, data]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">{label}</h4>
              {data && (
                <div className="space-y-1 text-sm">
                  <div>Avg: {formatMs(data.avg)}</div>
                  <div>Min: {formatMs(data.min)}</div>
                  <div>Max: {formatMs(data.max)}</div>
                  <div>Count: {data.count}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Memory Usage
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-700 mb-2">Used Heap</h4>
            <div className="text-2xl font-bold text-blue-900">
              {memoryInfo.usedJSHeapSize ? formatBytes(memoryInfo.usedJSHeapSize) : 'N/A'}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-700 mb-2">Total Heap</h4>
            <div className="text-2xl font-bold text-green-900">
              {memoryInfo.totalJSHeapSize ? formatBytes(memoryInfo.totalJSHeapSize) : 'N/A'}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-700 mb-2">Heap Limit</h4>
            <div className="text-2xl font-bold text-purple-900">
              {memoryInfo.jsHeapSizeLimit ? formatBytes(memoryInfo.jsHeapSizeLimit) : 'N/A'}
            </div>
          </div>
        </div>

        {memoryInfo.usedJSHeapSize && memoryInfo.totalJSHeapSize && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Memory Usage</span>
              <span>
                {((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Network Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Connection Type</h4>
            <div className="text-lg font-semibold">
              {networkInfo.effectiveType || 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Downlink</h4>
            <div className="text-lg font-semibold">
              {networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">RTT</h4>
            <div className="text-lg font-semibold">
              {networkInfo.rtt ? `${networkInfo.rtt}ms` : 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Data Saver</h4>
            <div className="text-lg font-semibold">
              {networkInfo.saveData !== undefined ? (networkInfo.saveData ? 'On' : 'Off') : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cache Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-indigo-700 mb-2">Cache Size</h4>
            <div className="text-2xl font-bold text-indigo-900">
              {cacheStats.size || 0}
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-indigo-700 mb-2">Max Size</h4>
            <div className="text-2xl font-bold text-indigo-900">
              {cacheStats.maxSize || 0}
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-medium text-indigo-700 mb-2">Usage</h4>
            <div className="text-2xl font-bold text-indigo-900">
              {cacheStats.size && cacheStats.maxSize 
                ? `${((cacheStats.size / cacheStats.maxSize) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
          </div>
        </div>

        {cacheStats.keys && cacheStats.keys.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Cached Keys</h4>
            <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-600 space-y-1">
                {cacheStats.keys.slice(0, 10).map((key: string, index: number) => (
                  <div key={index} className="font-mono">{key}</div>
                ))}
                {cacheStats.keys.length > 10 && (
                  <div className="text-gray-500">
                    ... and {cacheStats.keys.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Actions
        </h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => memoryCache.clear()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
          
          <button
            onClick={() => memoryCache.cleanup()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Cleanup Expired
          </button>
          
          <button
            onClick={() => {
              if ('gc' in window && typeof (window as any).gc === 'function') {
                (window as any).gc();
              } else {
                alert('Garbage collection not available in this browser');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Force GC
          </button>
        </div>
      </div>
    </div>
  );
}