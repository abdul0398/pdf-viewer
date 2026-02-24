'use client'

import { useState, useRef, useCallback } from 'react'

interface UploadedPdf {
  id: string
  originalName: string
}

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = useCallback((f: File) => {
    setError(null)
    setUploadedPdf(null)

    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum size is 20 MB.')
      return
    }
    setFile(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) validateAndSetFile(f)
    },
    [validateAndSetFile]
  )

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed.')
        return
      }

      setUploadedPdf({ id: data.id, originalName: data.originalName })
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setUploadedPdf(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : ''

  return (
    <div className="w-full max-w-lg space-y-5">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-200 outline-none
          ${dragging
            ? 'border-blue-400 bg-blue-500/10'
            : file
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/60'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f) }}
        />

        {file ? (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-medium text-sm truncate px-4">{file.name}</p>
            <p className="text-gray-500 text-xs">{sizeMB} MB · PDF</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="text-gray-500 hover:text-gray-300 text-xs underline mt-1 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <UploadIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {dragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
              </p>
              <p className="text-gray-500 text-xs mt-1">or click to browse · Max 20 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Upload button */}
      {file && !uploadedPdf && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <LockIcon className="w-4 h-4" />
              Upload PDF
            </>
          )}
        </button>
      )}

      {/* Success state */}
      {uploadedPdf && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckIcon className="w-4 h-4" />
            <span className="text-sm font-medium">PDF uploaded successfully</span>
          </div>

          <p className="text-gray-300 text-sm truncate">{uploadedPdf.originalName}</p>

          <a
            href={`/admin/pdfs/${uploadedPdf.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Manage shares →
          </a>

          <button
            onClick={reset}
            className="block w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
          >
            Upload another document
          </button>
        </div>
      )}
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}
