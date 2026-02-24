import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const userSession = await auth()

  if (!userSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { shareId } = await params

  const share = await prisma.pdfShare.findUnique({
    where: { id: shareId },
    include: { upload: true },
  })

  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  if (share.userId !== userSession.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (share.revokedAt) {
    return NextResponse.json({ error: 'Access revoked' }, { status: 403 })
  }

  // Return existing valid session if one exists
  const existing = await prisma.viewSession.findFirst({
    where: {
      shareId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: 'desc' },
  })

  if (existing) {
    return NextResponse.json({
      viewToken: existing.viewToken,
      originalName: share.upload.originalName,
    })
  }

  // Create a new 2-hour session
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const viewSession = await prisma.viewSession.create({
    data: { shareId, expiresAt },
  })

  return NextResponse.json({
    viewToken: viewSession.viewToken,
    originalName: share.upload.originalName,
  })
}
