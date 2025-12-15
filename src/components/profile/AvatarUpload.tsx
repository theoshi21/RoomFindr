'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadAvatar, deleteAvatar } from '../../lib/profile-simple'

interface AvatarUploadProps {
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ onSuccess, onError }) => {
  const { user, refreshUser } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.user?.id) return

    setIsUploading(true)

    try {
      const result = await uploadAvatar({ file, userId: user.user.id })
      
      if (result.error) {
        onError?.(result.error)
      } else if (result.url) {
        await refreshUser()
        onSuccess?.(result.url)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar'
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user?.user?.id) return

    setIsDeleting(true)

    try {
      const result = await deleteAvatar(user.user.id)
      
      if (result.error) {
        onError?.(result.error)
      } else {
        await refreshUser()
        onSuccess?.('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete avatar'
      onError?.(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const currentAvatar = user?.profile?.avatar
  const hasAvatar = Boolean(currentAvatar)

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {hasAvatar ? (
            <img
              src={currentAvatar || ''}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={triggerFileSelect}
          disabled={isUploading || isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : hasAvatar ? 'Change Avatar' : 'Upload Avatar'}
        </button>

        {hasAvatar && (
          <button
            onClick={handleDeleteAvatar}
            disabled={isUploading || isDeleting}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Remove'}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Guidelines */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Upload a photo up to 5MB in size.
        </p>
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  )
}