'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { canAccessPdf } from '@/lib/pdf-access'

interface SharedPdf {
  shareId: string
  originalName: string
  fileSize: number
  sharedAt: string
  sharedBy: string
}

type Modal =
  | { type: 'none' }
  | { type: 'verify'; shareId: string; pdfName: string }
  | { type: 'denied' }

export default function UserPdfList() {
  const { data: session, update: updateSession } = useSession()
  const [pdfs, setPdfs] = useState<SharedPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>({ type: 'none' })

  // Track verification locally so it takes effect without waiting for session refresh
  const [isVerified, setIsVerified] = useState<boolean>(
    session?.user?.mobileVerified ?? false
  )

  // Sync with session once it loads
  useEffect(() => {
    if (session?.user?.mobileVerified) setIsVerified(true)
  }, [session?.user?.mobileVerified])

  // Phone verification form state
  const [mobile, setMobile] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetch('/api/user/pdfs')
      .then((r) => r.json())
      .then((data) => { setPdfs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const userColor = session?.user?.color

  function handleView(shareId: string, pdfName: string) {
    if (!isVerified) {
      setModal({ type: 'verify', shareId, pdfName })
      return
    }
    proceedToOpen(shareId, pdfName)
  }

  function proceedToOpen(shareId: string, pdfName: string) {
    if (!canAccessPdf(userColor, pdfName)) {
      setModal({ type: 'denied' })
      return
    }
    openPdf(shareId)
  }

  async function openPdf(shareId: string) {
    setModal({ type: 'none' })
    setOpening(shareId)
    try {
      const res = await fetch(`/api/access/${shareId}`, { method: 'POST' })
      if (!res.ok) return
      const { viewToken } = await res.json()
      window.location.href = `/view/${viewToken}`
    } finally {
      setOpening(null)
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (modal.type !== 'verify') return
    setVerifyError(null)
    setVerifying(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVerifyError(data.error || 'Verification failed')
        return
      }
      // Mark verified locally and refresh session in background
      setIsVerified(true)
      updateSession()
      // Proceed with the PDF that triggered the modal
      proceedToOpen(modal.shareId, modal.pdfName)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>

  if (pdfs.length === 0) return (
    <p className="text-gray-500 text-sm">No documents have been shared with you yet.</p>
  )

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400 text-xs">
              <th className="pb-3 pr-6 font-medium">Name</th>
              <th className="pb-3 pr-6 font-medium">Shared by</th>
              <th className="pb-3 pr-6 font-medium">Date</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pdfs.map((pdf) => (
              <tr key={pdf.shareId} className="border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors">
                <td className="py-3 pr-6 text-white font-medium max-w-[220px]">
                  <span className="block truncate">{pdf.originalName}</span>
                </td>
                <td className="py-3 pr-6 text-gray-400">{pdf.sharedBy}</td>
                <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                  {new Date(pdf.sharedAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleView(pdf.shareId, pdf.originalName)}
                    disabled={opening === pdf.shareId}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  >
                    {opening === pdf.shareId ? 'Opening…' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone Verification Modal */}
      {modal.type === 'verify' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm0 3.5a1 1 0 011 1v4a1 1 0 01-.293.707l-2 2a1 1 0 01-1.414-1.414L9 9.586V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">Verify Your Identity</h2>
              <p className="text-sm text-gray-400">Enter your registered mobile number to access documents.</p>
            </div>
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg text-gray-400 text-sm select-none">
                    +65
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, '').slice(0, 8))
                      setVerifyError(null)
                    }}
                    placeholder="8 digit mobile number"
                    maxLength={8}
                    autoFocus
                    className={`w-full bg-gray-800 border text-white rounded-r-lg px-4 py-2.5 text-sm outline-none focus:ring-1 transition-colors ${verifyError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'}`}
                  />
                </div>
                {verifyError && (
                  <p className="text-red-400 text-xs mt-1.5">{verifyError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setModal({ type: 'none' }); setMobile(''); setVerifyError(null) }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || mobile.length < 8}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Denied Modal */}
      {modal.type === 'denied' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-3">Access Restricted</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Oops! It looks like access is available only to participants who have attended the PropNex RES Seminar.
            </p>
            <button
              onClick={() => setModal({ type: 'none' })}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
