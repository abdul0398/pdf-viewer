'use client'

import { useState, useEffect } from 'react'

interface SharedPdf {
  shareId: string
  originalName: string
  fileSize: number
  sharedAt: string
  sharedBy: string
}

export default function UserPdfList() {
  const [pdfs, setPdfs] = useState<SharedPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/pdfs')
      .then((r) => r.json())
      .then((data) => { setPdfs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleView = async (shareId: string) => {
    setOpening(shareId)
    setError(null)
    try {
      const res = await fetch(`/api/access/${shareId}`, { method: 'POST' })
      if (!res.ok) {
        setError('Unable to open document. Access may have been revoked.')
        return
      }
      const { viewToken } = await res.json()
      window.location.href = `/view/${viewToken}`
    } catch {
      setError('Unable to open document. Please try again.')
    } finally {
      setOpening(null)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>

  if (pdfs.length === 0) return (
    <p className="text-gray-500 text-sm">No documents have been shared with you yet.</p>
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}
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
                    onClick={() => handleView(pdf.shareId)}
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
    </div>
  )
}
