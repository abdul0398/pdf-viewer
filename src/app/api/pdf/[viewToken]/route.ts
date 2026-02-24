import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ viewToken: string }> }
) {
  const { viewToken } = await params

  const session = await prisma.viewSession.findUnique({
    where: { viewToken },
    include: { share: { include: { upload: true } } },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 410 })
  }

  try {
    // Fetch PDF from Vercel Blob server-side; raw URL is never exposed to client
    const response = await fetch(session.share.upload.blobUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await response.arrayBuffer()

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
