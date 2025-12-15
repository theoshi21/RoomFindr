import { Suspense } from 'react'
import { EmailVerificationForm } from '../../../components/auth'

function VerifyContent() {
  return <EmailVerificationForm />
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Verify Email - RoomFindr',
  description: 'Verify your email address'
}