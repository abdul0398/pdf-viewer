'use client'

import { useState } from 'react'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function UserList({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
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
