import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DeviceApprovalList from '@/components/DeviceApprovalList'

export default async function AdminDevicesPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const devices = await prisma.deviceSession.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { requestedAt: 'desc' },
  })

  const pendingCount = devices.filter((d) => d.status === 'PENDING').length

  // Serialize Date fields to ISO strings for client component
  const serialized = devices.map((d) => ({
    ...d,
    requestedAt: d.requestedAt.toISOString(),
    approvedAt: d.approvedAt?.toISOString() ?? null,
    rejectedAt: d.rejectedAt?.toISOString() ?? null,
    revokedAt: d.revokedAt?.toISOString() ?? null,
    lastLoginAt: d.lastLoginAt?.toISOString() ?? null,
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </a>
          <span className="text-xs text-gray-500">{session.user.email}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Device Approvals</h1>
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm -mt-4">
          Approve or reject devices requesting access. Each user can have up to 2 approved devices.
        </p>

        <DeviceApprovalList initialDevices={serialized} />
      </div>
    </main>
  )
}
