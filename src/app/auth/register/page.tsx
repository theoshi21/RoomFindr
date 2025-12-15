import { AuthModal } from '../../../components/auth'

export default function RegisterPage() {
  return <AuthModal initialMode="register" />
}

export const metadata = {
  title: 'Create Account - RoomFindr',
  description: 'Create your RoomFindr account'
}