'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/pdfs')
      .then((r) => r.json())
      .then((data) => { setPdfs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

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

  async function handleDelete(pdfId: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove access for all users.`)) return
    setDeleting(pdfId)
    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}`, { method: 'DELETE' })
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== pdfId))
      }
    } finally {
      setDeleting(null)
    }
  }

  function startEdit(pdf: PdfItem) {
    setEditingId(pdf.id)
    setEditName(pdf.originalName)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function saveEdit(pdfId: string) {
    const trimmed = editName.trim()
    if (!trimmed) return
    setSavingId(pdfId)
    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        const data = await res.json()
        setPdfs((prev) =>
          prev.map((p) => (p.id === pdfId ? { ...p, originalName: data.originalName } : p))
        )
        setEditingId(null)
      }
    } finally {
      setSavingId(null)
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
              <td className="py-3 pr-6 text-white font-medium max-w-50">
                {editingId === pdf.id ? (
                  <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(pdf.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="w-full bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-gray-400"
                  />
                ) : (
                  <span className="block truncate">{pdf.originalName}</span>
                )}
              </td>
              <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
              </td>
              <td className="py-3 pr-6 text-gray-400 whitespace-nowrap">
                {new Date(pdf.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleView(pdf.id)}
                    disabled={viewing === pdf.id || editingId === pdf.id}
                    className="text-gray-400 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {viewing === pdf.id ? 'Opening…' : 'View'}
                  </button>

                  {editingId === pdf.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(pdf.id)}
                        disabled={savingId === pdf.id || !editName.trim()}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {savingId === pdf.id ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(pdf)}
                      className="text-gray-400 hover:text-white text-xs font-medium transition-colors"
                    >
                      Rename
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(pdf.id, pdf.originalName)}
                    disabled={deleting === pdf.id || editingId === pdf.id}
                    className="text-gray-400 hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {deleting === pdf.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
