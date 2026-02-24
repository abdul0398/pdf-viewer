import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: uploadId } = await params

  const upload = await prisma.pdfUpload.findUnique({ where: { id: uploadId } })
  if (!upload) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  // Upsert an admin self-share so we can attach a ViewSession to it
  const share = await prisma.pdfShare.upsert({
    where: { uploadId_userId: { uploadId, userId: session.user.id } },
    create: { uploadId, userId: session.user.id },
    update: { revokedAt: null }, // reactivate if it was revoked
  })

  // Reuse an existing valid session or create a fresh 2-hour one
  const existing = await prisma.viewSession.findFirst({
    where: { shareId: share.id, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
  })

  if (existing) {
    return NextResponse.json({ viewToken: existing.viewToken, originalName: upload.originalName })
  }

  const viewSession = await prisma.viewSession.create({
    data: { shareId: share.id, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) },
  })

  return NextResponse.json({ viewToken: viewSession.viewToken, originalName: upload.originalName })
}
