'use client'

import { useState } from 'react'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  mobile: string | null
  color: string | null
  agentName: string | null
  createdAt: string
}

interface EditModal {
  userId: string
  currentColor: string | null
}

function ColorBadge({ color }: { color: string | null }) {
  if (!color) return <span className="text-gray-600">—</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          color === 'green' ? 'bg-green-500' : 'bg-white'
        }`}
      />
      <span className="text-gray-300 capitalize">{color}</span>
    </span>
  )
}

export default function UserList({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

  // Edit color modal
  const [editModal, setEditModal] = useState<EditModal | null>(null)
  const [pendingColor, setPendingColor] = useState<string | null>(null)
  const [informUser, setInformUser] = useState(false)
  const [saving, setSaving] = useState(false)

  function openEdit(user: UserRecord) {
    setEditModal({ userId: user.id, currentColor: user.color })
    setPendingColor(user.color)
    setInformUser(false)
  }

  function closeEdit() {
    setEditModal(null)
  }

  async function handleSaveColor() {
    if (!editModal) return
    setSaving(true)

    const res = await fetch(`/api/admin/users/${editModal.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: pendingColor, informUser }),
    })

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editModal.userId ? { ...u, color: pendingColor } : u))
      )
      closeEdit()
    }

    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDeleting((prev) => ({ ...prev, [id]: true }))

    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }

    setDeleting((prev) => ({ ...prev, [id]: false }))
  }

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-white">{user.name}</td>
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-gray-300">{user.mobile || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-300">{user.agentName || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <ColorBadge color={user.color} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== 'ADMIN' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit color"
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting[user.id]}
                          className="text-xs px-2.5 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                        >
                          {deleting[user.id] ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit color modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-5">Edit User Color</h3>

            {/* Color dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
              <select
                value={pendingColor ?? ''}
                onChange={(e) => setPendingColor(e.target.value || null)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">None</option>
                <option value="white">White — Exam Papers Only</option>
                <option value="green">Green — Notes &amp; Exam Papers</option>
              </select>
            </div>

            {/* Inform user radio */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-300 mb-2">Would you like to inform the User?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="informUser"
                    checked={informUser}
                    onChange={() => setInformUser(true)}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-300">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="informUser"
                    checked={!informUser}
                    onChange={() => setInformUser(false)}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-300">No</span>
                </label>
              </div>
              {informUser && (
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  An email will be sent notifying the user that RES notes are available.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeEdit}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColor}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
