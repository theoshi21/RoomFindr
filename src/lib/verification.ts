import { supabase, createAdminClient } from './supabase'
import type { 
  Database 
} from '../types/database'

type LandlordVerification = Database['public']['Tables']['landlord_verifications']['Row']
type VerificationDocument = Database['public']['Tables']['verification_documents']['Row']

export interface VerificationSubmissionData {
  documents: File[]
  documentTypes: ('id' | 'business_permit' | 'property_deed' | 'other')[]
}

export interface VerificationReviewData {
  verificationId: string
  status: 'approved' | 'rejected'
  feedback?: string
  reviewedBy: string
}

export interface VerificationWithDocuments extends LandlordVerification {
  documents: VerificationDocument[]
  landlord_profile?: {
    first_name: string
    last_name: string
    email: string
  }
}

// Submit verification documents for a landlord
export async function submitVerificationDocuments(
  landlordId: string,
  data: VerificationSubmissionData
): Promise<{ success: boolean; error?: string; verificationId?: string }> {
  try {
    console.log('=== Starting verification submission ===')
    console.log('Landlord ID:', landlordId)
    console.log('Documents count:', data.documents.length)
    
    // Upload documents first
    const uploadedDocuments = []
    
    for (let i = 0; i < data.documents.length; i++) {
      const file = data.documents[i]
      const documentType = data.documentTypes[i]
      
      console.log(`Uploading document ${i + 1}/${data.documents.length}:`, {
        name: file.name,
        type: documentType,
        size: file.size
      })
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('landlordId', landlordId)
      formData.append('documentType', documentType)
      
      const uploadResponse = await fetch('/api/landlord/verification/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        let errorMessage = `Upload failed: HTTP ${uploadResponse.status}`
        try {
          const errorData = await uploadResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Use default message
        }
        throw new Error(errorMessage)
      }
      
      const uploadResult = await uploadResponse.json()
      console.log('Upload result:', uploadResult)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }
      
      uploadedDocuments.push({
        type: documentType,
        filename: uploadResult.fileName,
        filePath: uploadResult.filePath,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType
      })
    }
    
    console.log('All documents uploaded successfully')
    
    // Submit verification with document info
    const submitResponse = await fetch('/api/landlord/verification/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        landlordId,
        documents: uploadedDocuments
      })
    })
    
    if (!submitResponse.ok) {
      let errorMessage = `Submission failed: HTTP ${submitResponse.status}`
      try {
        const errorData = await submitResponse.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage)
    }
    
    const submitResult = await submitResponse.json()
    console.log('Submission result:', submitResult)
    
    if (!submitResult.success) {
      throw new Error(submitResult.error || 'Submission failed')
    }
    
    console.log('Verification submitted successfully!')
    
    return { 
      success: true, 
      verificationId: submitResult.verificationId 
    }
  } catch (error) {
    console.error('Error submitting verification documents:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit documents' 
    }
  }
}

// Get verification status for a landlord
export async function getVerificationStatus(
  landlordId: string
): Promise<{ verification: VerificationWithDocuments | null; error?: string }> {
  try {
    const { data: verification, error } = await supabase
      .from('landlord_verifications')
      .select(`
        *,
        verification_documents (*)
      `)
      .eq('landlord_id', landlordId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return { verification: verification as VerificationWithDocuments | null }
  } catch (error) {
    console.error('Error getting verification status:', error)
    return { 
      verification: null, 
      error: error instanceof Error ? error.message : 'Failed to get verification status' 
    }
  }
}

// Get all pending verifications (admin only) - client-side version
export async function getPendingVerifications(): Promise<{
  verifications: VerificationWithDocuments[]
  error?: string
}> {
  try {
    const response = await fetch('/api/admin/verifications/pending')
    
    if (!response.ok) {
      throw new Error('Failed to fetch pending verifications')
    }
    
    const result = await response.json()
    
    // Transform the data to match our interface
    const transformedVerifications = result.verifications?.map((v: any) => ({
      ...v,
      documents: v.verification_documents || [],
      landlord_profile: v.users?.user_profiles?.[0] ? {
        first_name: v.users.user_profiles[0].first_name,
        last_name: v.users.user_profiles[0].last_name,
        email: v.users.email
      } : undefined
    })) || []

    return { verifications: transformedVerifications }
  } catch (error) {
    console.error('Error getting pending verifications:', error)
    return { 
      verifications: [], 
      error: error instanceof Error ? error.message : 'Failed to get pending verifications' 
    }
  }
}

// Review verification (admin only) - client-side version
export async function reviewVerification(
  data: VerificationReviewData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== Starting verification review ===')
    console.log('Request data:', data)
    
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch('/api/admin/verifications/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log('Response received:')
    console.log('- Status:', response.status)
    console.log('- Status Text:', response.statusText)
    console.log('- Headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        console.log('Error response data:', errorData)
      } catch (e) {
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
          console.log('Error response text:', errorText)
        } catch (e2) {
          console.log('Could not parse error response')
        }
      }
      console.error('API call failed:', errorMessage)
      return { success: false, error: errorMessage }
    }
    
    const result = await response.json()
    console.log('Success response:', result)
    return result
  } catch (error) {
    console.error('Verification review error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out - please try again' }
      }
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Unknown error occurred' }
  }
}

// Get document URL for viewing (with signed URL)
export async function getDocumentUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  } catch (error) {
    console.error('Error getting document URL:', error)
    return null
  }
}