import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import { DeviceStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const statusParam = searchParams.get('status')

  const where = statusParam
    ? { status: statusParam as DeviceStatus }
    : {}

  const devices = await prisma.deviceSession.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: 'desc' },
  })

  return NextResponse.json(devices)
}
