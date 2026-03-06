'use client'

import { useState, useMemo, useEffect } from 'react'

interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  mobile: string | null
  color: string | null
  agentName: string | null
  active: boolean
  devices: number
  createdAt: string
}

interface EditModal {
  userId: string
  currentColor: string | null
  currentName: string
  currentEmail: string
  currentMobile: string | null
}

type StatusFilter = 'all' | 'active' | 'inactive'

function ColorBadge({ color }: { color: string | null }) {
  if (!color) return <span className="text-gray-600">—</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color === 'green' ? 'bg-green-500' : 'bg-white'}`} />
      <span className="text-gray-300 capitalize">{color}</span>
    </span>
  )
}

export default function UserList({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)

  // Sync when server refreshes with new data (e.g. after creating a user)
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [togglingActive, setTogglingActive] = useState<Record<string, boolean>>({})

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Edit modal
  const [editModal, setEditModal] = useState<EditModal | null>(null)
  const [pendingName, setPendingName] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingMobile, setPendingMobile] = useState('')
  const [mobileError, setMobileError] = useState<string | null>(null)
  const [pendingColor, setPendingColor] = useState<string | null>(null)
  const [informUser, setInformUser] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.active) return false
      if (statusFilter === 'inactive' && u.active) return false

      const created = new Date(u.createdAt)
      created.setHours(0, 0, 0, 0)

      if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        if (created < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (created > to) return false
      }

      return true
    })
  }, [users, statusFilter, dateFrom, dateTo])

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo

  function clearFilters() {
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  function openEdit(user: UserRecord) {
    setEditModal({ userId: user.id, currentColor: user.color, currentName: user.name, currentEmail: user.email, currentMobile: user.mobile })
    setPendingName(user.name)
    setPendingEmail(user.email)
    setPendingMobile(user.mobile ?? '')
    setPendingColor(user.color)
    setInformUser(false)
    setSaveError(null)
    setMobileError(null)
  }

  function closeEdit() {
    setEditModal(null)
    setSaveError(null)
    setMobileError(null)
  }

  async function handleSave() {
    if (!editModal) return

    if (pendingMobile && !/^[89]\d{7}$/.test(pendingMobile)) {
      setMobileError('Must be 8 digits starting with 8 or 9')
      return
    }

    setSaving(true)
    setSaveError(null)

    const res = await fetch(`/api/admin/users/${editModal.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pendingName,
        email: pendingEmail,
        mobile: pendingMobile || null,
        color: pendingColor,
        informUser,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editModal.userId
            ? { ...u, name: data.name, email: data.email, mobile: data.mobile, color: data.color }
            : u
        )
      )
      if (data.emailError) {
        setSaveError(`Saved, but email failed: ${data.emailError}`)
      } else {
        closeEdit()
      }
    } else {
      setSaveError(data.error || 'Failed to save')
    }

    setSaving(false)
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setTogglingActive((prev) => ({ ...prev, [id]: true }))
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !currentActive } : u)))
    }
    setTogglingActive((prev) => ({ ...prev, [id]: false }))
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
      {/* Filters bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3 flex flex-wrap items-end gap-4">
        {/* Status filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-1.5">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  statusFilter === s
                    ? s === 'active'
                      ? 'bg-green-600/30 border-green-500 text-green-400'
                      : s === 'inactive'
                      ? 'bg-red-600/30 border-red-500 text-red-400'
                      : 'bg-gray-700 border-gray-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Created Date</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
              />
              {dateFrom && (
                <button
                  onClick={() => setDateFrom('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  ×
                </button>
              )}
            </div>
            <span className="text-gray-600 text-xs">to</span>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
              />
              {dateTo && (
                <button
                  onClick={() => setDateTo('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clear + count */}
        <div className="flex items-end gap-3 ml-auto">
          <span className="text-xs text-gray-500">
            {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Devices</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-600 text-sm">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3 text-gray-300">{user.mobile || <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3 text-gray-300">{user.agentName || <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3">
                      <ColorBadge color={user.color} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.devices > 0 ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-700 text-gray-500'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                        </svg>
                        {user.devices}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-green-400' : 'bg-red-400'}`} />
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
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
                            onClick={() => handleToggleActive(user.id, user.active)}
                            disabled={togglingActive[user.id]}
                            title={user.active ? 'Deactivate user' : 'Activate user'}
                            className={`text-xs px-2.5 py-1 rounded-md disabled:opacity-50 transition-colors ${
                              user.active
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            }`}
                          >
                            {togglingActive[user.id] ? '…' : user.active ? 'Deactivate' : 'Activate'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit color modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-5">Edit User</h3>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={pendingEmail}
                onChange={(e) => setPendingEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Mobile */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mobile</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg text-gray-400 text-sm select-none">+65</span>
                <input
                  type="tel"
                  value={pendingMobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setPendingMobile(val)
                    setMobileError(null)
                  }}
                  maxLength={8}
                  placeholder="8 or 9XXXXXXX"
                  className={`w-full bg-gray-800 border text-white rounded-r-lg px-3 py-2.5 text-sm outline-none focus:ring-1 transition-colors ${mobileError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'}`}
                />
              </div>
              {mobileError && <p className="text-red-400 text-xs mt-1">{mobileError}</p>}
            </div>

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

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-300 mb-2">Would you like to inform the User?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="informUser" checked={informUser} onChange={() => setInformUser(true)} className="accent-green-500" />
                  <span className="text-sm text-gray-300">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="informUser" checked={!informUser} onChange={() => setInformUser(false)} className="accent-green-500" />
                  <span className="text-sm text-gray-300">No</span>
                </label>
              </div>
              {informUser && (
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  An email will be sent notifying the user that RES notes are available.
                </p>
              )}
            </div>

            {saveError && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeEdit}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
