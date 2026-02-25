import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
