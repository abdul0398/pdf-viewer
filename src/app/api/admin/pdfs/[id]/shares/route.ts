import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const shares = await prisma.pdfShare.findMany({
    where: { uploadId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { sharedAt: 'desc' },
  })

  return NextResponse.json(shares)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  // Reject if an active (non-revoked) share already exists
  const existing = await prisma.pdfShare.findFirst({
    where: { uploadId: id, userId, revokedAt: null },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already shared with this user' }, { status: 409 })
  }

  // Upsert: handles re-sharing after revocation
  const share = await prisma.pdfShare.upsert({
    where: { uploadId_userId: { uploadId: id, userId } },
    update: { revokedAt: null, sharedAt: new Date() },
    create: { uploadId: id, userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(share, { status: 201 })
}
