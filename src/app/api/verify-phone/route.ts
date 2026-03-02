import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Not applicable for admin' }, { status: 400 })
  }

  const body = await req.json()
  const entered = typeof body.mobile === 'string' ? body.mobile.trim() : ''

  if (!entered) {
    return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mobile: true, mobileVerified: true },
  })

  if (!user?.mobile) {
    return NextResponse.json({ error: 'No mobile number on file' }, { status: 400 })
  }

  if (user.mobile !== entered) {
    return NextResponse.json({ error: 'Incorrect mobile number' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mobileVerified: true },
  })

  return NextResponse.json({ success: true })
}
