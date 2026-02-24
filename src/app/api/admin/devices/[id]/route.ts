import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await req.json()

  const device = await prisma.deviceSession.findUnique({ where: { id } })
  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  if (action === 'approve') {
    const approvedCount = await prisma.deviceSession.count({
      where: { userId: device.userId, status: 'APPROVED', id: { not: id } },
    })
    if (approvedCount >= 2) {
      return NextResponse.json(
        { error: 'User already has 2 approved devices. Revoke one first.' },
        { status: 409 }
      )
    }
    const updated = await prisma.deviceSession.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  if (action === 'reject') {
    const updated = await prisma.deviceSession.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  if (action === 'revoke') {
    if (device.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only APPROVED devices can be revoked.' },
        { status: 400 }
      )
    }
    const updated = await prisma.deviceSession.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
