import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '../components/profile/ProfileForm'
import { AvatarUpload } from '../components/profile/AvatarUpload'
import { updateUserProfile, uploadAvatar, deleteAvatar } from '../lib/profile-simple'
import type { AuthContextType, UserWithProfile } from '../types/auth'

// Mock the profile library functions
vi.mock('../lib/profile-simple', () => ({
  updateUserProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
  validateProfileData: vi.fn(() => [])
}))

// Mock the AuthContext
const mockAuthContext: AuthContextType = {
  user: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'tenant',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true,
      is_verified: true
    },
    profile: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      avatar: null,
      bio: 'Test bio',
      preferences: {
        notifications: true,
        emailUpdates: true,
        theme: 'light'
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  } as UserWithProfile,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  verifyEmail: vi.fn(),
  refreshUser: vi.fn()
}

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}))

describe('Profile Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(updateUserProfile).mockClear()
    vi.mocked(uploadAvatar).mockClear()
    vi.mocked(deleteAvatar).mockClear()
  })

  describe('ProfileForm Component', () => {
    it('should render profile form with user data', () => {
      render(<ProfileForm />)
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })

    it('should display form fields correctly', () => {
      render(<ProfileForm />)
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/receive push notifications/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/receive email updates/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
    })

    it('should handle form input changes', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Jane')
      
      expect(firstNameInput).toHaveValue('Jane')
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.clear(firstNameInput)
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      // The form should prevent submission with empty required fields
      expect(firstNameInput).toBeInvalid()
    })

    it('should handle preference changes', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      const notificationCheckbox = screen.getByLabelText(/receive push notifications/i)
      expect(notificationCheckbox).toBeChecked()
      
      await user.click(notificationCheckbox)
      expect(notificationCheckbox).not.toBeChecked()
    })

    it('should handle theme selection', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      const themeSelect = screen.getByLabelText(/theme/i)
      await user.selectOptions(themeSelect, 'dark')
      
      expect(themeSelect).toHaveValue('dark')
    })

    it('should show bio character count', () => {
      render(<ProfileForm />)
      
      expect(screen.getByText(/8\/500 characters/i)).toBeInTheDocument()
    })

    it('should call onSuccess when form submission succeeds', async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({ success: true })
      
      const onSuccess = vi.fn()
      const user = userEvent.setup()
      
      render(<ProfileForm onSuccess={onSuccess} />)
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(updateUserProfile).toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should show loading state during submission', async () => {
      vi.mocked(updateUserProfile).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))
      
      const user = userEvent.setup()
      render(<ProfileForm />)
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      expect(screen.getByText(/saving.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()
      
      render(<ProfileForm onCancel={onCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('AvatarUpload Component', () => {
    it('should render avatar upload component', () => {
      render(<AvatarUpload />)
      
      expect(screen.getByRole('button', { name: /upload avatar/i })).toBeInTheDocument()
      expect(screen.getByText(/upload a photo up to 5mb in size/i)).toBeInTheDocument()
    })

    it('should show default avatar when no avatar is set', () => {
      render(<AvatarUpload />)
      
      // Should show the default user icon SVG
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle file selection', async () => {
      vi.mocked(uploadAvatar).mockResolvedValue({ url: 'https://example.com/new-avatar.jpg', error: null })
      
      const user = userEvent.setup()
      render(<AvatarUpload />)
      
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      if (fileInput) {
        await user.upload(fileInput, file)
        
        await waitFor(() => {
          expect(uploadAvatar).toHaveBeenCalledWith({
            file,
            userId: 'test-user-id'
          })
        })
      }
    })

    it('should show loading state during upload', async () => {
      vi.mocked(uploadAvatar).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ url: 'test.jpg', error: null }), 100)))
      
      const user = userEvent.setup()
      render(<AvatarUpload />)
      
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      if (fileInput) {
        await user.upload(fileInput, file)
        
        expect(screen.getByText(/uploading.../i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /uploading.../i })).toBeDisabled()
      }
    })

    it('should call onSuccess when upload succeeds', async () => {
      vi.mocked(uploadAvatar).mockResolvedValue({ url: 'https://example.com/new-avatar.jpg', error: null })
      
      const onSuccess = vi.fn()
      const user = userEvent.setup()
      
      render(<AvatarUpload onSuccess={onSuccess} />)
      
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      if (fileInput) {
        await user.upload(fileInput, file)
        
        await waitFor(() => {
          expect(onSuccess).toHaveBeenCalledWith('https://example.com/new-avatar.jpg')
        })
      }
    })

    it('should call onError when upload fails', async () => {
      vi.mocked(uploadAvatar).mockResolvedValue({ url: null, error: 'Upload failed' })
      
      const onError = vi.fn()
      const user = userEvent.setup()
      
      render(<AvatarUpload onError={onError} />)
      
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      if (fileInput) {
        await user.upload(fileInput, file)
        
        await waitFor(() => {
          expect(onError).toHaveBeenCalledWith('Upload failed')
        })
      }
    })

    it('should show supported file formats', () => {
      render(<AvatarUpload />)
      
      expect(screen.getByText(/supported formats: jpg, png, gif, webp/i)).toBeInTheDocument()
    })
  })
})