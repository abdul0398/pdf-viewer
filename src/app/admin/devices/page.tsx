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
    where: { status: 'APPROVED' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { lastLoginAt: 'desc' },
  })

  const serialized = devices.map((d) => ({
    id: d.id,
    deviceId: d.deviceId,
    deviceName: d.deviceName,
    lastLoginAt: d.lastLoginAt?.toISOString() ?? null,
    user: d.user,
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
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Logged-in Devices</h1>
          <p className="text-gray-400 text-sm">
            Devices currently approved and active for each user.
          </p>
        </div>

        <DeviceApprovalList initialDevices={serialized} />
      </div>
    </main>
  )
}
