import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const uploads = await prisma.pdfUpload.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json(
    uploads.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      fileSize: u.fileSize,
      createdAt: u.createdAt,
      uploader: u.uploader,
    }))
  )
}
