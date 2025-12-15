import { AuthModal } from '../../../components/auth'

export default function ResetPasswordPage() {
  return <AuthModal initialMode="reset" />
}

export const metadata = {
  title: 'Reset Password - RoomFindr',
  description: 'Reset your RoomFindr password'
}