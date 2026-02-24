import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shares = await prisma.pdfShare.findMany({
    where: { userId: session.user.id, revokedAt: null },
    include: {
      upload: {
        include: { uploader: { select: { name: true } } },
      },
    },
    orderBy: { sharedAt: 'desc' },
  })

  return NextResponse.json(
    shares.map((s) => ({
      shareId: s.id,
      uploadId: s.uploadId,
      originalName: s.upload.originalName,
      fileSize: s.upload.fileSize,
      sharedAt: s.sharedAt,
      sharedBy: s.upload.uploader.name,
    }))
  )
}
