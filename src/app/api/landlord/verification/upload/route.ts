import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== File Upload API Called ===')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const landlordId = formData.get('landlordId') as string
    const documentType = formData.get('documentType') as string
    
    console.log('Upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      landlordId,
      documentType
    })
    
    if (!file || !landlordId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or landlord ID' },
        { status: 400 }
      )
    }
    
    // Create admin client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${documentType}_${timestamp}.${fileExtension}`
    const filePath = `${landlordId}/${fileName}`
    
    console.log('Uploading file to path:', filePath)
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('verification-documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }
    
    console.log('File uploaded successfully:', uploadData.path)
    
    return NextResponse.json({
      success: true,
      filePath: uploadData.path,
      fileName: fileName,
      fileSize: file.size,
      mimeType: file.type
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    )
  }
}