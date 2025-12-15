export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Debug Page - RoomFindr
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          This page bypasses authentication to test basic functionality
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Server Status</h3>
          <p className="text-green-600">✅ Next.js server is running</p>
          <p className="text-green-600">✅ React rendering is working</p>
          <p className="text-green-600">✅ Tailwind CSS is loaded</p>
        </div>
      </div>
    </div>
  )
}