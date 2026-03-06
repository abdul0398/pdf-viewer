import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { prisma } from '@/lib/prisma'
import { sendNotesUploadedEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { color, informUser, active, name, email, mobile } = body

  // Toggle active status
  if (typeof active === 'boolean') {
    const user = await prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, active: true },
    })
    return NextResponse.json(user)
  }

  if (color !== null && color !== 'white' && color !== 'green') {
    return NextResponse.json({ error: 'Color must be white, green, or null' }, { status: 400 })
  }

  if (mobile !== undefined && mobile !== null && mobile !== '') {
    if (!/^[89]\d{7}$/.test(mobile)) {
      return NextResponse.json({ error: 'Mobile must be 8 digits starting with 8 or 9' }, { status: 400 })
    }
  }

  if (email) {
    const conflict = await prisma.user.findFirst({ where: { email, NOT: { id } } })
    if (conflict) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  if (mobile) {
    const conflict = await prisma.user.findFirst({ where: { mobile, NOT: { id } } })
    if (conflict) return NextResponse.json({ error: 'Mobile number already in use' }, { status: 409 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      color: color ?? null,
      ...(name  ? { name }                    : {}),
      ...(email ? { email }                   : {}),
      mobile: mobile || null,
    },
    select: { id: true, color: true, name: true, email: true, mobile: true },
  })

  let emailError: string | null = null
  if (informUser) {
    try {
      await sendNotesUploadedEmail({ to: user.email })
    } catch (err) {
      console.error('[email] Failed to send notes email:', err)
      emailError = err instanceof Error ? err.message : 'Unknown email error'
    }
  }

  return NextResponse.json({ ...user, emailError })
}

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

  await prisma.$transaction([
    // ViewSessions on shares directly owned by this user
    prisma.viewSession.deleteMany({ where: { share: { userId: id } } }),
    // ViewSessions on shares belonging to uploads by this user
    prisma.viewSession.deleteMany({ where: { share: { upload: { uploadedBy: id } } } }),
    // Shares directly owned by this user
    prisma.pdfShare.deleteMany({ where: { userId: id } }),
    // Shares on uploads by this user
    prisma.pdfShare.deleteMany({ where: { upload: { uploadedBy: id } } }),
    // Uploads by this user
    prisma.pdfUpload.deleteMany({ where: { uploadedBy: id } }),
    // User (DeviceSession cascades automatically)
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}
