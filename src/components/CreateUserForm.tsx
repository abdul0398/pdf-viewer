'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateUserForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [mobileError, setMobileError] = useState<string | null>(null)
  const [color, setColor] = useState<'white' | 'green'>('white')
  const [agentName, setAgentName] = useState('Stewart Lim')
  const [sendEmail, setSendEmail] = useState(false)
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
        body: JSON.stringify({ name, email, password, mobile: mobile || undefined, color, agentName: agentName || undefined, sendEmail }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create user')
        return
      }

      if (data.emailResent) {
        setSuccess(`Login email sent again${data.emailError ? ` (email failed: ${data.emailError})` : ''}`)
        return
      }

      setSuccess(`User ${data.email} created successfully${data.emailError ? ` (email failed: ${data.emailError})` : ''}`)
      setName('')
      setEmail('')
      setPassword('')
      setMobile('')
      setColor('white')
      setAgentName('Stewart Lim')
      setSendEmail(false)
      router.refresh()
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
            <label htmlFor="user-agent-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Agent Name
            </label>
            <select
              id="user-agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="Stewart Lim">Stewart Lim</option>
              <option value="Jasmine Lau">Jasmine Lau</option>
              <option value="Sam Lim">Sam Lim</option>
              <option value="Huang Han">Huang Han</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Would you like to send an email?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSendEmail(true)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  sendEmail
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setSendEmail(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  !sendEmail
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {(['white', 'green'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    color === c
                      ? c === 'white'
                        ? 'bg-white border-gray-300 text-gray-900'
                        : 'bg-green-600 border-green-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-2 space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                Green — Notes &amp; Exam Papers
              </p>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                White — Exam Papers Only
              </p>
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
