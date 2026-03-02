'use client'

import { useState } from 'react'

export default function CreateUserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [mobileError, setMobileError] = useState<string | null>(null)
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setMobileError(null)

    if (mobile && !/^[89]\d{7}$/.test(mobile)) {
      setMobileError('Must be 8 digits starting with 8 or 9')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile: mobile || undefined, color: color || undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create user')
        return
      }

      setSuccess(`User ${data.email} created successfully`)
      setName('')
      setEmail('')
      setPassword('')
      setMobile('')
      setColor('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Create New User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label htmlFor="user-mobile" className="block text-sm font-medium text-gray-300 mb-1.5">
              Mobile <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg text-gray-400 text-sm select-none">
                +65
              </span>
              <input
                id="user-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setMobile(val)
                  setMobileError(null)
                }}
                className={`w-full bg-gray-800 border text-white rounded-r-lg px-4 py-2.5 text-sm outline-none focus:ring-1 transition-colors ${mobileError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="8 or 9XXXXXXX"
                maxLength={8}
              />
            </div>
            {mobileError && (
              <p className="text-red-400 text-xs mt-1">{mobileError}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-color" className="block text-sm font-medium text-gray-300 mb-1.5">
              Color <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="user-color"
                type="color"
                value={color || '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                maxLength={7}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
              />
              {color && (
                <button
                  type="button"
                  onClick={() => setColor('')}
                  className="text-gray-500 hover:text-gray-300 text-xs shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            'Create User'
          )}
        </button>
      </form>
    </div>
  )
}
