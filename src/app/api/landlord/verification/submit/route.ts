import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Verification Submission API Called ===')
    
    const data = await request.json()
    console.log('Request data:', data)
    
    // Validate required fields
    if (!data.landlordId) {
      console.log('Missing landlord ID')
      return NextResponse.json(
        { success: false, error: 'Missing landlord ID' },
        { status: 400 }
      )
    }
    
    // Create admin client directly with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.log('Missing environment variables')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    console.log('Creating Supabase client with service role...')
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if verification already exists
    console.log('Checking for existing verification...')
    const { data: existingVerification, error: checkError } = await adminClient
      .from('landlord_verifications')
      .select('id, status')
      .eq('landlord_id', data.landlordId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing verification:', checkError)
      return NextResponse.json(
        { success: false, error: `Database error: ${checkError.message}` },
        { status: 500 }
      )
    }

    let verificationId: string

    if (existingVerification) {
      console.log('Found existing verification:', existingVerification.id)
      verificationId = existingVerification.id
      
      // Update status back to pending if it was rejected
      if (existingVerification.status === 'rejected') {
        console.log('Updating rejected verification to pending...')
        const { error: updateError } = await adminClient
          .from('landlord_verifications')
          .update({
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
            feedback: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationId)

        if (updateError) {
          console.error('Error updating verification:', updateError)
          return NextResponse.json(
            { success: false, error: `Failed to update verification: ${updateError.message}` },
            { status: 500 }
          )
        }
      }
    } else {
      console.log('Creating new verification record...')
      const { data: newVerification, error: createError } = await adminClient
        .from('landlord_verifications')
        .insert({
          landlord_id: data.landlordId,
          status: 'pending'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating verification:', createError)
        return NextResponse.json(
          { success: false, error: `Failed to create verification: ${createError.message}` },
          { status: 500 }
        )
      }

      verificationId = newVerification.id
      console.log('Created new verification:', verificationId)
    }

    // If documents are provided, save them
    if (data.documents && data.documents.length > 0) {
      console.log(`Saving ${data.documents.length} document records...`)
      
      // Delete existing documents for this verification
      const { error: deleteError } = await adminClient
        .from('verification_documents')
        .delete()
        .eq('verification_id', verificationId)

      if (deleteError) {
        console.log('Warning: Could not delete existing documents:', deleteError)
      }

      // Insert new document records
      const documentRecords = data.documents.map((doc: any) => ({
        verification_id: verificationId,
        document_type: doc.type || 'other',
        filename: doc.filename,
        file_path: doc.filePath,
        file_size: doc.fileSize || null,
        mime_type: doc.mimeType || null
      }))

      const { error: documentsError } = await adminClient
        .from('verification_documents')
        .insert(documentRecords)

      if (documentsError) {
        console.error('Error saving document records:', documentsError)
        return NextResponse.json(
          { success: false, error: `Failed to save document records: ${documentsError.message}` },
          { status: 500 }
        )
      }

      console.log('Document records saved successfully')
    }
    
    console.log('Verification submission completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification submitted successfully',
      verificationId: verificationId
    })
  } catch (error) {
    console.error('Error submitting verification:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit verification' 
      },
      { status: 500 }
    )
  }
}