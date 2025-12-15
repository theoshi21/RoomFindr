import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-blue-100 p-3">
            <Search className="h-8 w-8 text-blue-600" aria-hidden="true" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="space-y-3">
          <Link href="/search" className="block">
            <div className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Search className="h-4 w-4 mr-2" />
              Search Rooms
            </div>
          </Link>
          
          <Link href="/" className="block">
            <div className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}