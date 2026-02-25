import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20 MB limit' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const pathname = `${Date.now()}-${safeName}`
    const blob = await put(pathname, file, { access: 'public' })

    const upload = await prisma.pdfUpload.create({
      data: {
        blobUrl: blob.url,
        originalName: file.name,
        fileSize: file.size,
        uploadedBy: session.user.id,
      },
    })

    // Auto-share with all existing non-admin users
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    })
    if (users.length > 0) {
      await prisma.pdfShare.createMany({
        data: users.map((u) => ({ uploadId: upload.id, userId: u.id })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ id: upload.id, originalName: upload.originalName })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
