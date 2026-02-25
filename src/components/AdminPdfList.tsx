'use client'

import { useState, useEffect } from 'react'

interface PdfItem {
  id: string
  originalName: string
  fileSize: number
  createdAt: string
  uploader: { name: string; email: string }
}

export default function AdminPdfList() {
  const [pdfs, setPdfs] = useState<PdfItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/pdfs')
      .then((r) => r.json())
      .then((data) => { setPdfs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleView(pdfId: string) {
    setViewing(pdfId)
    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}/view`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        window.open(`/view/${data.viewToken}`, '_blank')
      }
    } finally {
      setViewing(null)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading…</p>
  if (pdfs.length === 0) return <p className="text-gray-500 text-sm">No PDFs uploaded yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-gray-400 text-xs">
            <th className="pb-3 pr-6 font-medium">Name</th>
            <th className="pb-3 pr-6 font-medium">Size</th>
            <th className="pb-3 pr-6 font-medium">Uploaded</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {pdfs.map((pdf) => (
            <tr key={pdf.id} className="border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors">
              <td className="py-3 pr-6 text-white font-medium max-w-[200px]">
                <span className="block truncate">{pdf.originalName}</span>
              </td>
              <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
              </td>
              <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                {new Date(pdf.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <button
                  onClick={() => handleView(pdf.id)}
                  disabled={viewing === pdf.id}
                  className="text-gray-400 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {viewing === pdf.id ? 'Opening…' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
