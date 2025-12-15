'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    addResult('🔄 Starting Supabase connection tests...')
    
    try {
      // Test 1: Basic connection
      addResult('Test 1: Basic connection test')
      const startTime = Date.now()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      })
      
      const connectionPromise = supabase.from('users').select('count').limit(1)
      
      const { data, error } = await Promise.race([connectionPromise, timeoutPromise])
      const duration = Date.now() - startTime
      
      if (error) {
        addResult(`❌ Connection failed (${duration}ms): ${error.message}`)
        addResult(`   Error code: ${error.code || 'N/A'}`)
        addResult(`   Error details: ${JSON.stringify(error, null, 2)}`)
      } else {
        addResult(`✅ Connection successful (${duration}ms)`)
        addResult(`   Response: ${JSON.stringify(data)}`)
      }
      
    } catch (error: any) {
      addResult(`❌ Connection test failed: ${error.message}`)
      
      if (error.message.includes('timeout')) {
        addResult('   This appears to be a timeout issue')
      }
      if (error.message.includes('SSL') || error.message.includes('certificate')) {
        addResult('   This appears to be an SSL certificate issue')
      }
      if (error.message.includes('CORS')) {
        addResult('   This appears to be a CORS issue')
      }
    }
    
    try {
      // Test 2: Auth endpoint
      addResult('Test 2: Auth endpoint test')
      const authStartTime = Date.now()
      
      const authTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth timeout after 5 seconds')), 5000)
      })
      
      const authPromise = supabase.auth.getSession()
      
      const { data: authData, error: authError } = await Promise.race([authPromise, authTimeoutPromise])
      const authDuration = Date.now() - authStartTime
      
      if (authError) {
        addResult(`❌ Auth test failed (${authDuration}ms): ${authError.message}`)
      } else {
        addResult(`✅ Auth endpoint accessible (${authDuration}ms)`)
        addResult(`   Session: ${authData.session ? 'Active session found' : 'No active session'}`)
      }
      
    } catch (error: any) {
      addResult(`❌ Auth test failed: ${error.message}`)
    }
    
    try {
      // Test 3: Network info
      addResult('Test 3: Network information')
      addResult(`   User Agent: ${navigator.userAgent}`)
      addResult(`   Online: ${navigator.onLine}`)
      addResult(`   Connection: ${(navigator as any).connection?.effectiveType || 'Unknown'}`)
      
    } catch (error: any) {
      addResult(`❌ Network info failed: ${error.message}`)
    }
    
    setIsLoading(false)
    addResult('🏁 All tests complete')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Supabase Connection Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running Tests...' : 'Run Connection Tests'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500">Click "Run Connection Tests" to start...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Environment Info</h3>
          <div className="text-sm text-blue-800">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}