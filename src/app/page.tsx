'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { getRoleBasedRedirect } from '../lib/auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboard
      const redirectPath = getRoleBasedRedirect(user.user.role)
      router.push(redirectPath)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
          <p className="text-sm text-gray-500 mt-2">
            If this takes too long, there might be a database connection issue.
          </p>
          <button 
            onClick={() => window.location.href = '/debug'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Debug Page
          </button>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">RoomFindr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/search"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Browse Rooms
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to RoomFindr
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find your perfect room rental with verified landlords
          </p>
          
          <div className="flex justify-center space-x-4 mb-12">
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-md text-lg font-medium transition-colors"
            >
              Start Your Search
            </Link>
            <Link
              href="/auth/login"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md text-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold mb-2">For Tenants</h3>
              <p className="text-gray-600">
                Search and book rooms from verified landlords with secure payment
                processing and roommate matching.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold mb-2">For Landlords</h3>
              <p className="text-gray-600">
                List your properties and manage reservations with our
                comprehensive platform and verification system.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-purple-600 text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold mb-2">Secure & Verified</h3>
              <p className="text-gray-600">
                All landlords are verified through our document verification
                system for your safety and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose RoomFindr?
            </h2>
            <p className="text-lg text-gray-600">
              We make room finding and renting simple, secure, and transparent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Landlords</h3>
              <p className="text-gray-600 text-sm">All landlords go through our verification process</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">Safe and secure payment processing</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Roommate Matching</h3>
              <p className="text-gray-600 text-sm">Find compatible roommates for shared spaces</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Management</h3>
              <p className="text-gray-600 text-sm">Manage everything from your dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 RoomFindr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
