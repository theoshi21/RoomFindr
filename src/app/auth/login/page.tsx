import { LoginForm } from '../../../components/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Sign In - RoomFindr',
  description: 'Sign in to your RoomFindr account'
}