'use client'

interface DeviceRecord {
  id: string
  deviceId: string
  deviceName: string
  lastLoginAt: string | null
  user: { id: string; name: string; email: string }
}

export default function DeviceApprovalList({
  initialDevices,
}: {
  initialDevices: DeviceRecord[]
}) {
  if (initialDevices.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-gray-500 text-sm px-6 py-8 text-center">No logged-in devices.</p>
      </div>
    )
  }

  // Group by user
  const byUser = initialDevices.reduce<Record<string, { user: DeviceRecord['user']; devices: DeviceRecord[] }>>(
    (acc, d) => {
      if (!acc[d.user.id]) acc[d.user.id] = { user: d.user, devices: [] }
      acc[d.user.id].devices.push(d)
      return acc
    },
    {}
  )

  return (
    <div className="space-y-4">
      {Object.values(byUser).map(({ user, devices }) => (
        <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
            <div>
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.email}</p>
            </div>
            <span className="ml-auto text-xs text-gray-500">{devices.length}/2 device{devices.length !== 1 ? 's' : ''}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-gray-300">{d.deviceName}</p>
                    <p className="text-gray-600 text-xs font-mono truncate max-w-[200px]">{d.deviceId}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
