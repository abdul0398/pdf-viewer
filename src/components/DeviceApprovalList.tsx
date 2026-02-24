'use client'

import { useState } from 'react'

type DeviceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'

interface DeviceRecord {
  id: string
  deviceId: string
  deviceName: string
  userAgent: string
  status: DeviceStatus
  requestedAt: string
  approvedAt: string | null
  rejectedAt: string | null
  revokedAt: string | null
  lastLoginAt: string | null
  user: { id: string; name: string; email: string }
}

type FilterTab = 'ALL' | DeviceStatus

const STATUS_BADGE: Record<DeviceStatus, string> = {
  PENDING:  'bg-yellow-500/20 text-yellow-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  REVOKED:  'bg-gray-600/40 text-gray-400',
}

export default function DeviceApprovalList({
  initialDevices,
}: {
  initialDevices: DeviceRecord[]
}) {
  const [devices, setDevices] = useState<DeviceRecord[]>(initialDevices)
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const pendingCount = devices.filter((d) => d.status === 'PENDING').length

  const filtered =
    activeTab === 'ALL' ? devices : devices.filter((d) => d.status === activeTab)

  async function handleAction(id: string, action: 'approve' | 'reject' | 'revoke') {
    setLoading((prev) => ({ ...prev, [id]: true }))
    setErrors((prev) => ({ ...prev, [id]: '' }))

    const res = await fetch(`/api/admin/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    const data = await res.json()
    setLoading((prev) => ({ ...prev, [id]: false }))

    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [id]: data.error ?? 'Action failed' }))
      return
    }

    // Update device in local state
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: data.status,
              approvedAt: data.approvedAt,
              rejectedAt: data.rejectedAt,
              revokedAt: data.revokedAt,
            }
          : d
      )
    )
  }

  const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Revoked', value: 'REVOKED' },
  ]

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.value === 'PENDING' && pendingCount > 0 && (
              <span className="bg-yellow-500 text-gray-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm px-6 py-8 text-center">No devices found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((device) => (
                <tr key={device.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{device.user.name}</p>
                    <p className="text-gray-500 text-xs">{device.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300">{device.deviceName}</p>
                    <p className="text-gray-600 text-xs font-mono truncate max-w-[160px]">
                      {device.deviceId}
                    </p>
                    {errors[device.id] && (
                      <p className="text-red-400 text-xs mt-1">{errors[device.id]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(device.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[device.status]}`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {device.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(device.id, 'approve')}
                            disabled={loading[device.id]}
                            className="text-xs px-2.5 py-1 rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(device.id, 'reject')}
                            disabled={loading[device.id]}
                            className="text-xs px-2.5 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {device.status === 'APPROVED' && (
                        <button
                          onClick={() => handleAction(device.id, 'revoke')}
                          disabled={loading[device.id]}
                          className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
