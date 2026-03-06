'use client'

import { useState } from 'react'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  mobile: string | null
  color: string | null
  createdAt: string
}

export default function UserList({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [updatingColor, setUpdatingColor] = useState<Record<string, boolean>>({})

  async function handleDelete(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setDeleting((prev) => ({ ...prev, [id]: true }))

    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }

    setDeleting((prev) => ({ ...prev, [id]: false }))
  }

  async function handleColorChange(id: string, color: string | null) {
    setUpdatingColor((prev) => ({ ...prev, [id]: true }))

    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })

    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, color } : u)))
    }

    setUpdatingColor((prev) => ({ ...prev, [id]: false }))
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
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
              <td className="px-4 py-3 text-gray-300">{user.mobile ? `+65 ${user.mobile}` : <span className="text-gray-600">—</span>}</td>
              <td className="px-4 py-3">
                <div className={`flex gap-1 ${updatingColor[user.id] ? 'opacity-50 pointer-events-none' : ''}`}>
                  {(['white', 'green', null] as const).map((c) => (
                    <button
                      key={c ?? 'none'}
                      type="button"
                      onClick={() => handleColorChange(user.id, c)}
                      title={c ?? 'None'}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        user.color === c
                          ? c === 'white'
                            ? 'bg-white border-gray-300'
                            : c === 'green'
                            ? 'bg-green-500 border-green-300'
                            : 'bg-gray-600 border-gray-400'
                          : c === 'white'
                          ? 'bg-white/30 border-white/30 hover:border-white/60'
                          : c === 'green'
                          ? 'bg-green-500/30 border-green-500/30 hover:border-green-400'
                          : 'bg-gray-700 border-gray-600 hover:border-gray-400'
                      }`}
                    />
                  ))}
                </div>
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
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting[user.id]}
                    className="text-xs px-2.5 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
                  >
                    {deleting[user.id] ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
