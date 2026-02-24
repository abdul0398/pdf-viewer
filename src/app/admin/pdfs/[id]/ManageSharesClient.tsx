'use client'

import { useState } from 'react'

interface ShareEntry {
  id: string
  userId: string
  sharedAt: string
  revokedAt: string | null
  user: { id: string; name: string; email: string }
}

interface User {
  id: string
  name: string
  email: string
}

interface Props {
  uploadId: string
  initialShares: ShareEntry[]
  allUsers: User[]
}

export default function ManageSharesClient({ uploadId, initialShares, allUsers }: Props) {
  const [shares, setShares] = useState<ShareEntry[]>(initialShares)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [sharing, setSharing] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Users not currently holding an active share
  const activeUserIds = new Set(
    shares.filter((s) => !s.revokedAt).map((s) => s.userId)
  )
  const availableUsers = allUsers.filter((u) => !activeUserIds.has(u.id))

  const handleShare = async () => {
    if (!selectedUserId) return
    setSharing(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/pdfs/${uploadId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to share.')
        return
      }

      setShares((prev) => [data, ...prev])
      setSelectedUserId('')
    } catch {
      setError('Failed to share. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    setRevoking(userId)
    setError(null)

    try {
      const res = await fetch(`/api/admin/pdfs/${uploadId}/shares/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        setError('Failed to revoke access.')
        return
      }

      setShares((prev) =>
        prev.map((s) =>
          s.userId === userId ? { ...s, revokedAt: new Date().toISOString() } : s
        )
      )
    } catch {
      setError('Failed to revoke. Please try again.')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Share with user */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold">Share with user</h2>
        {availableUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">All users already have access.</p>
        ) : (
          <div className="flex gap-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">Select a user…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleShare}
              disabled={!selectedUserId || sharing}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              {sharing ? 'Sharing…' : 'Share'}
            </button>
          </div>
        )}
      </div>

      {/* Shares table */}
      <div>
        <h2 className="text-base font-semibold mb-4">Access list</h2>
        {shares.length === 0 ? (
          <p className="text-gray-500 text-sm">No shares yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400 text-xs">
                  <th className="pb-3 pr-6 font-medium">User</th>
                  <th className="pb-3 pr-6 font-medium">Shared</th>
                  <th className="pb-3 pr-6 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <tr key={share.id} className="border-b border-gray-800/50">
                    <td className="py-3 pr-6">
                      <p className="text-white font-medium">{share.user.name}</p>
                      <p className="text-gray-500 text-xs">{share.user.email}</p>
                    </td>
                    <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                      {new Date(share.sharedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-6">
                      {share.revokedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {!share.revokedAt && (
                        <button
                          onClick={() => handleRevoke(share.userId)}
                          disabled={revoking === share.userId}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs font-medium transition-colors"
                        >
                          {revoking === share.userId ? 'Revoking…' : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
