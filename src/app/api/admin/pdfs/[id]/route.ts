import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const upload = await prisma.pdfUpload.findUnique({ where: { id } })
  if (!upload) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.viewSession.deleteMany({ where: { share: { uploadId: id } } }),
    prisma.pdfShare.deleteMany({ where: { uploadId: id } }),
    prisma.pdfUpload.delete({ where: { id } }),
  ])

  // Delete from Vercel Blob (best-effort, don't fail the request)
  try {
    await del(upload.blobUrl)
  } catch {
    // ignore blob deletion errors
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const name = typeof body.name === 'string' ? body.name.trim() : null

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const upload = await prisma.pdfUpload.findUnique({ where: { id } })
  if (!upload) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  const updated = await prisma.pdfUpload.update({
    where: { id },
    data: { originalName: name },
  })

  return NextResponse.json({ id: updated.id, originalName: updated.originalName })
}
