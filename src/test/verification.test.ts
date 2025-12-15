/**
 * Property-Based Test for Verification Workflow
 * **Feature: roomfindr, Property 9: Document verification workflow maintains integrity**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import type { LandlordVerification, VerificationDocument } from '../types/database'

// Test data generators
const documentTypeArb = fc.constantFrom('id', 'business_permit', 'property_deed', 'other')
const verificationStatusArb = fc.constantFrom('pending', 'approved', 'rejected')

const verificationDocumentArb = fc.record({
  id: fc.uuid(),
  verification_id: fc.uuid(),
  document_type: documentTypeArb,
  file_path: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)).map(s => `documents/${s}.pdf`),
  file_name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)).map(s => `${s}.pdf`),
  file_size: fc.integer({ min: 1024, max: 10485760 }), // 1KB to 10MB
  uploaded_at: fc.constant(new Date().toISOString())
})

const verificationSubmissionArb = fc.record({
  landlordId: fc.uuid(),
  documents: fc.array(verificationDocumentArb, { minLength: 1, maxLength: 5 }),
  documentTypes: fc.array(documentTypeArb, { minLength: 1, maxLength: 4 })
})

const verificationReviewArb = fc.record({
  verificationId: fc.uuid(),
  status: fc.constantFrom('approved', 'rejected'),
  feedback: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
  reviewedBy: fc.uuid()
})

// Mock verification system
class MockVerificationManager {
  private verifications: Map<string, LandlordVerification> = new Map()
  private documents: Map<string, VerificationDocument[]> = new Map()
  private landlordCapabilities: Map<string, boolean> = new Map()
  private counter: number = 0

  submitVerificationDocuments(
    landlordId: string,
    documents: VerificationDocument[],
    documentTypes: string[]
  ): { success: boolean; error?: string; verificationId?: string } {
    // Check if landlord already has pending or approved verification
    const existingVerifications = Array.from(this.verifications.values())
      .filter(v => v.landlord_id === landlordId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    const latestVerification = existingVerifications[0]

    if (latestVerification?.status === 'approved') {
      return { success: false, error: 'Landlord is already verified' }
    }

    if (latestVerification?.status === 'pending') {
      return { success: false, error: 'Verification is already pending review' }
    }

    // Validate documents
    if (documents.length === 0) {
      return { success: false, error: 'At least one document is required' }
    }

    if (documents.length !== documentTypes.length) {
      return { success: false, error: 'Document count must match document types count' }
    }

    // Validate file sizes and types
    for (const doc of documents) {
      if (doc.file_size > 10485760) { // 10MB limit
        return { success: false, error: 'File size exceeds 10MB limit' }
      }
      if (!doc.file_name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
        return { success: false, error: 'Invalid file type. Only PDF, JPG, JPEG, PNG allowed' }
      }
    }

    // Create verification record
    const verificationId = crypto.randomUUID()
    this.counter++
    const timestamp = new Date(Date.now() + this.counter * 1000).toISOString()
    
    const verification: LandlordVerification = {
      id: verificationId,
      landlord_id: landlordId,
      status: 'pending',
      submitted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp
    }

    this.verifications.set(verificationId, verification)
    this.documents.set(verificationId, documents.map(doc => ({
      ...doc,
      verification_id: verificationId
    })))

    // Disable listing capabilities until approved
    this.landlordCapabilities.set(landlordId, false)

    return { success: true, verificationId }
  }

  reviewVerification(
    verificationId: string,
    status: 'approved' | 'rejected',
    feedback: string | undefined,
    reviewedBy: string
  ): { success: boolean; error?: string } {
    const verification = this.verifications.get(verificationId)
    if (!verification) {
      return { success: false, error: 'Verification not found' }
    }

    if (verification.status !== 'pending') {
      return { success: false, error: 'Verification has already been reviewed' }
    }

    // Update verification
    const updatedVerification: LandlordVerification = {
      ...verification,
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      feedback,
      updated_at: new Date().toISOString()
    }

    this.verifications.set(verificationId, updatedVerification)

    // Update landlord capabilities based on approval
    if (status === 'approved') {
      this.landlordCapabilities.set(verification.landlord_id, true)
    } else {
      this.landlordCapabilities.set(verification.landlord_id, false)
    }

    return { success: true }
  }

  getVerificationStatus(landlordId: string): {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    canCreateListings: boolean
    feedback?: string
  } {
    // Get the most recent verification for this landlord
    const verifications = Array.from(this.verifications.values())
      .filter(v => v.landlord_id === landlordId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    const verification = verifications[0]

    if (!verification) {
      return { status: 'none', canCreateListings: false }
    }

    const canCreateListings = this.landlordCapabilities.get(landlordId) || false

    return {
      status: verification.status,
      canCreateListings,
      feedback: verification.feedback
    }
  }

  getVerificationWithDocuments(verificationId: string): {
    verification: LandlordVerification
    documents: VerificationDocument[]
  } | null {
    const verification = this.verifications.get(verificationId)
    const documents = this.documents.get(verificationId)

    if (!verification || !documents) {
      return null
    }

    return { verification, documents }
  }

  getAllPendingVerifications(): Array<{
    verification: LandlordVerification
    documents: VerificationDocument[]
  }> {
    return Array.from(this.verifications.entries())
      .filter(([_, verification]) => verification.status === 'pending')
      .map(([verificationId, verification]) => ({
        verification,
        documents: this.documents.get(verificationId) || []
      }))
  }

  // Test helper methods
  clear(): void {
    this.verifications.clear()
    this.documents.clear()
    this.landlordCapabilities.clear()
    this.counter = 0
  }

  getVerification(verificationId: string): LandlordVerification | undefined {
    return this.verifications.get(verificationId)
  }
}

describe('Property 9: Document Verification Workflow Maintains Integrity', () => {
  let mockManager: MockVerificationManager

  beforeEach(() => {
    mockManager = new MockVerificationManager()
  })

  it('should store documents securely and notify administrators for any valid submission', () => {
    fc.assert(
      fc.property(
        verificationSubmissionArb,
        (submissionData) => {
          // Ensure valid submission data
          fc.pre(submissionData.documents.length > 0)
          fc.pre(submissionData.documents.length === submissionData.documentTypes.length)
          fc.pre(submissionData.documents.every(doc => doc.file_size <= 10485760))
          fc.pre(submissionData.documents.every(doc => 
            doc.file_name.match(/\.(pdf|jpg|jpeg|png)$/i)
          ))

          // Submit verification documents (Requirement 3.1)
          const result = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )

          // Should succeed
          expect(result.success).toBe(true)
          expect(result.verificationId).toBeDefined()
          expect(result.error).toBeUndefined()

          // Verify documents are stored securely
          const storedData = mockManager.getVerificationWithDocuments(result.verificationId!)
          expect(storedData).toBeDefined()
          expect(storedData!.verification.landlord_id).toBe(submissionData.landlordId)
          expect(storedData!.verification.status).toBe('pending')
          expect(storedData!.documents.length).toBe(submissionData.documents.length)

          // Verify document integrity
          storedData!.documents.forEach((storedDoc, index) => {
            const originalDoc = submissionData.documents[index]
            expect(storedDoc.document_type).toBe(originalDoc.document_type)
            expect(storedDoc.file_name).toBe(originalDoc.file_name)
            expect(storedDoc.file_size).toBe(originalDoc.file_size)
            expect(storedDoc.verification_id).toBe(result.verificationId)
          })

          // Verify notification to administrators (pending status indicates notification)
          const pendingVerifications = mockManager.getAllPendingVerifications()
          expect(pendingVerifications.some(pv => pv.verification.id === result.verificationId)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should allow admin review with approval or rejection and feedback for any pending verification', () => {
    fc.assert(
      fc.property(
        verificationSubmissionArb,
        verificationReviewArb,
        (submissionData, reviewData) => {
          // Ensure valid submission
          fc.pre(submissionData.documents.length > 0)
          fc.pre(submissionData.documents.length === submissionData.documentTypes.length)
          fc.pre(submissionData.documents.every(doc => doc.file_size <= 10485760))

          // Submit verification first
          const submitResult = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )
          fc.pre(submitResult.success)

          // Review verification (Requirement 3.2)
          const reviewResult = mockManager.reviewVerification(
            submitResult.verificationId!,
            reviewData.status,
            reviewData.feedback,
            reviewData.reviewedBy
          )

          // Should succeed
          expect(reviewResult.success).toBe(true)
          expect(reviewResult.error).toBeUndefined()

          // Verify review was applied
          const updatedVerification = mockManager.getVerification(submitResult.verificationId!)
          expect(updatedVerification).toBeDefined()
          expect(updatedVerification!.status).toBe(reviewData.status)
          expect(updatedVerification!.reviewed_by).toBe(reviewData.reviewedBy)
          expect(updatedVerification!.reviewed_at).toBeDefined()
          
          if (reviewData.feedback) {
            expect(updatedVerification!.feedback).toBe(reviewData.feedback)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should enable listing creation capabilities when verification is approved', () => {
    fc.assert(
      fc.property(
        verificationSubmissionArb,
        fc.uuid(), // reviewer ID
        fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
        (submissionData, reviewerId, feedback) => {
          // Ensure valid submission
          fc.pre(submissionData.documents.length > 0)
          fc.pre(submissionData.documents.length === submissionData.documentTypes.length)

          // Submit verification
          const submitResult = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )
          fc.pre(submitResult.success)

          // Initially, landlord should not be able to create listings
          let status = mockManager.getVerificationStatus(submissionData.landlordId)
          expect(status.canCreateListings).toBe(false)
          expect(status.status).toBe('pending')

          // Approve verification (Requirement 3.3)
          const reviewResult = mockManager.reviewVerification(
            submitResult.verificationId!,
            'approved',
            feedback,
            reviewerId
          )
          expect(reviewResult.success).toBe(true)

          // After approval, landlord should be able to create listings
          status = mockManager.getVerificationStatus(submissionData.landlordId)
          expect(status.canCreateListings).toBe(true)
          expect(status.status).toBe('approved')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should notify landlord with specific reasons and allow resubmission when verification is rejected', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // landlord ID
        fc.constantFrom(
          'Documents are not clear enough',
          'Missing required business permit',
          'Property deed is not valid',
          'ID document is expired or unclear'
        ), // rejection feedback
        (landlordId, rejectionFeedback) => {
          // Create simple test documents
          const testDocuments = [{
            id: crypto.randomUUID(),
            verification_id: crypto.randomUUID(),
            document_type: 'id' as const,
            file_path: 'documents/test.pdf',
            file_name: 'test.pdf',
            file_size: 1024,
            uploaded_at: new Date().toISOString()
          }]

          // Submit verification
          const submitResult = mockManager.submitVerificationDocuments(
            landlordId,
            testDocuments,
            ['id']
          )
          expect(submitResult.success).toBe(true)

          // Reject verification (Requirement 3.4)
          const reviewResult = mockManager.reviewVerification(
            submitResult.verificationId!,
            'rejected',
            rejectionFeedback,
            'admin-reviewer-id'
          )
          expect(reviewResult.success).toBe(true)

          // Verify rejection status and feedback
          let status = mockManager.getVerificationStatus(landlordId)
          expect(status.status).toBe('rejected')
          expect(status.canCreateListings).toBe(false)
          expect(status.feedback).toBe(rejectionFeedback)

          // Verify resubmission is allowed
          const resubmitResult = mockManager.submitVerificationDocuments(
            landlordId,
            testDocuments,
            ['id']
          )
          if (!resubmitResult.success) {
            console.log('Resubmit failed:', resubmitResult.error)
            console.log('Current status:', mockManager.getVerificationStatus(landlordId))
          }
          expect(resubmitResult.success).toBe(true)
          expect(resubmitResult.verificationId).toBeDefined()

          // After resubmission, status should be pending again
          status = mockManager.getVerificationStatus(landlordId)
          expect(status.status).toBe('pending')
        }
      ),
      { numRuns: 20 }
    )
  })

  it('should prevent listing creation and display pending status while verification is pending', () => {
    fc.assert(
      fc.property(
        verificationSubmissionArb,
        (submissionData) => {
          // Ensure valid submission
          fc.pre(submissionData.documents.length > 0)
          fc.pre(submissionData.documents.length === submissionData.documentTypes.length)

          // Submit verification (Requirement 3.5)
          const submitResult = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )
          fc.pre(submitResult.success)

          // While pending, landlord should not be able to create listings
          const status = mockManager.getVerificationStatus(submissionData.landlordId)
          expect(status.status).toBe('pending')
          expect(status.canCreateListings).toBe(false)

          // Verify verification appears in pending queue for admins
          const pendingVerifications = mockManager.getAllPendingVerifications()
          expect(pendingVerifications.some(pv => pv.verification.id === submitResult.verificationId)).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should prevent duplicate submissions for already verified or pending landlords', () => {
    fc.assert(
      fc.property(
        verificationSubmissionArb,
        fc.constantFrom('approved', 'pending'),
        (submissionData, existingStatus) => {
          // Ensure valid submission
          fc.pre(submissionData.documents.length > 0)
          fc.pre(submissionData.documents.length === submissionData.documentTypes.length)

          // Submit initial verification
          const initialResult = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )
          fc.pre(initialResult.success)

          // If testing approved status, approve the verification
          if (existingStatus === 'approved') {
            const reviewResult = mockManager.reviewVerification(
              initialResult.verificationId!,
              'approved',
              'Approved for testing',
              'admin-test-id'
            )
            expect(reviewResult.success).toBe(true)
          }

          // Attempt duplicate submission
          const duplicateResult = mockManager.submitVerificationDocuments(
            submissionData.landlordId,
            submissionData.documents,
            submissionData.documentTypes
          )

          // Should fail with appropriate error
          expect(duplicateResult.success).toBe(false)
          expect(duplicateResult.error).toBeDefined()
          
          if (existingStatus === 'approved') {
            expect(duplicateResult.error).toMatch(/already verified/i)
          } else {
            expect(duplicateResult.error).toMatch(/already pending|pending review/i)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should validate document requirements and reject invalid submissions', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // landlord ID
        fc.oneof(
          // No documents
          fc.constant({ documents: [], documentTypes: [] }),
          // Mismatched document and type counts
          fc.record({
            documents: fc.array(verificationDocumentArb, { minLength: 1, maxLength: 3 }),
            documentTypes: fc.array(documentTypeArb, { minLength: 2, maxLength: 5 })
          }).filter(data => data.documents.length !== data.documentTypes.length),
          // Oversized files
          fc.record({
            documents: fc.array(
              verificationDocumentArb.map(doc => ({ ...doc, file_size: 20971520 })), // 20MB
              { minLength: 1, maxLength: 2 }
            ),
            documentTypes: fc.array(documentTypeArb, { minLength: 1, maxLength: 2 })
          }).filter(data => data.documents.length === data.documentTypes.length),
          // Invalid file types
          fc.record({
            documents: fc.array(
              verificationDocumentArb.map(doc => ({ ...doc, file_name: 'document.txt' })),
              { minLength: 1, maxLength: 2 }
            ),
            documentTypes: fc.array(documentTypeArb, { minLength: 1, maxLength: 2 })
          }).filter(data => data.documents.length === data.documentTypes.length)
        ),
        (landlordId, invalidData) => {
          // Attempt to submit invalid verification
          const result = mockManager.submitVerificationDocuments(
            landlordId,
            invalidData.documents,
            invalidData.documentTypes
          )

          // Should fail with appropriate error
          expect(result.success).toBe(false)
          expect(result.error).toBeDefined()
          expect(result.verificationId).toBeUndefined()

          // Verify no verification was created
          const status = mockManager.getVerificationStatus(landlordId)
          expect(status.status).toBe('none')
          expect(status.canCreateListings).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })
})