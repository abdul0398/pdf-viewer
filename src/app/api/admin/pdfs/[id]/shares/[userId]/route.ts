import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, userId } = await params

  try {
    await prisma.pdfShare.update({
      where: { uploadId_userId: { uploadId: id, userId } },
      data: { revokedAt: new Date() },
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }
}
