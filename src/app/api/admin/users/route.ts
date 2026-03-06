import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, password, mobile, color, agentName, sendEmail } = body

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: 'email, name, and password are required' },
      { status: 400 }
    )
  }

  if (mobile !== undefined && mobile !== null && mobile !== '') {
    if (!/^[89]\d{7}$/.test(mobile)) {
      return NextResponse.json(
        { error: 'Mobile must be a valid 8-digit Singaporean number starting with 8 or 9' },
        { status: 400 }
      )
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  if (mobile) {
    const mobileExists = await prisma.user.findFirst({ where: { mobile } })
    if (mobileExists) {
      return NextResponse.json({ error: 'Mobile number already in use' }, { status: 409 })
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: 'USER', mobile: mobile || null, color: color || null, agentName: agentName || null },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })

  // Auto-share all existing PDFs with the new user
  const uploads = await prisma.pdfUpload.findMany({ select: { id: true } })
  if (uploads.length > 0) {
    await prisma.pdfShare.createMany({
      data: uploads.map((u) => ({ uploadId: u.id, userId: user.id })),
      skipDuplicates: true,
    })
  }

  // Send welcome email only if admin opted in
  let emailError: string | null = null
  if (sendEmail) {
    try {
      await sendWelcomeEmail({ to: email, name, password })
    } catch (err) {
      console.error('[email] Failed to send welcome email:', err)
      emailError = err instanceof Error ? err.message : 'Unknown email error'
    }
  }

  return NextResponse.json({ ...user, emailError }, { status: 201 })
}

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}
