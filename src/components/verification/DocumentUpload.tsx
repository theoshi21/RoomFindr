'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { submitVerificationDocuments } from '../../lib/verification'
import type { VerificationSubmissionData } from '../../lib/verification'

interface DocumentUploadProps {
  landlordId: string
  onUploadComplete?: (success: boolean, message?: string) => void
}

interface DocumentFile {
  file: File
  type: 'id' | 'business_permit' | 'property_deed' | 'other'
  preview: string
}

const DOCUMENT_TYPES = [
  { value: 'id', label: 'Government ID', required: true },
  { value: 'business_permit', label: 'Business Permit', required: false },
  { value: 'property_deed', label: 'Property Deed/Title', required: true },
  { value: 'other', label: 'Other Supporting Documents', required: false }
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
  'application/pdf': ['.pdf']
}

export default function DocumentUpload({ landlordId, onUploadComplete }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([])
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      )
      setErrors(prev => [...prev, ...newErrors])
    }

    // Handle accepted files
    const newDocuments = acceptedFiles.map(file => ({
      file,
      type: 'other' as const, // Default type, user will change this
      preview: URL.createObjectURL(file)
    }))

    setDocuments(prev => [...prev, ...newDocuments])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  })

  const updateDocumentType = (index: number, type: DocumentFile['type']) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, type } : doc
    ))
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => {
      const newDocs = prev.filter((_, i) => i !== index)
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index].preview)
      return newDocs
    })
  }

  const validateDocuments = (): string[] => {
    const errors: string[] = []
    
    if (documents.length === 0) {
      errors.push('Please upload at least one document')
    }

    // Check for required document types
    const requiredTypes = DOCUMENT_TYPES.filter(type => type.required).map(type => type.value)
    const uploadedTypes = documents.map(doc => doc.type)
    
    for (const requiredType of requiredTypes) {
      if (!uploadedTypes.includes(requiredType)) {
        const typeLabel = DOCUMENT_TYPES.find(t => t.value === requiredType)?.label
        errors.push(`${typeLabel} is required`)
      }
    }

    return errors
  }

  const handleSubmit = async () => {
    const validationErrors = validateDocuments()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsUploading(true)
    setErrors([])

    try {
      const submissionData: VerificationSubmissionData = {
        documents: documents.map(doc => doc.file),
        documentTypes: documents.map(doc => doc.type)
      }

      const result = await submitVerificationDocuments(landlordId, submissionData)
      
      if (result.success) {
        onUploadComplete?.(true, 'Documents uploaded successfully! Your verification is now under review.')
        setDocuments([])
      } else {
        setErrors([result.error || 'Failed to upload documents'])
        onUploadComplete?.(false, result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload documents'
      setErrors([errorMessage])
      onUploadComplete?.(false, errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Verification Documents</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Required Documents</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {DOCUMENT_TYPES.map(type => (
              <li key={type.value} className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  type.required ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {type.label} {type.required && <span className="text-red-500 ml-1">*</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF up to 10MB</p>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {doc.file.type.startsWith('image/') ? (
                        <img 
                          src={doc.preview} 
                          alt={doc.file.name}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.file.name}</p>
                      <p className="text-sm text-gray-500">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex-shrink-0">
                      <select
                        value={doc.type}
                        onChange={(e) => updateDocumentType(index, e.target.value as DocumentFile['type'])}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {DOCUMENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(index)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {documents.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : (
                'Submit Documents'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}