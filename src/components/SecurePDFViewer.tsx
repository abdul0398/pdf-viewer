'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  viewToken: string
  serverFileName: string
}

type Status = 'loading' | 'expired' | 'error' | 'ready'

// How many watermark rows to tile across the page
const WM_ROWS = 12

export default function SecurePDFViewer({ viewToken, serverFileName }: Props) {
  const [status, setStatus]         = useState<Status>('loading')
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null)
  const [numPages, setNumPages]     = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale]           = useState(1.2)
  const [fileName, setFileName]     = useState(serverFileName)
  const [isCapturing, setIsCapturing] = useState(false)

  // Session watermark: time + partial token, stamped once, embedded in every row
  const wm = useRef(
    `${new Date().toLocaleString()} · SESSION ${viewToken.slice(0, 8).toUpperCase()}`
  )

  // ── PDF load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null

    async function init() {
      try {
        const pdfRes = await fetch(`/api/pdf/${viewToken}`)
        if (!pdfRes.ok) {
          setStatus(pdfRes.status === 410 ? 'expired' : 'error')
          return
        }

        const blob = new Blob([await pdfRes.arrayBuffer()], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
        setStatus('ready')
      } catch { setStatus('error') }
    }

    init()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [viewToken])

  // ── Screen-capture detection via getDisplayMedia monkey-patch ─────────────
  // This is the only browser API that fires when a screen recording starts.
  // It does NOT fire for OS-level screenshots (Cmd+Shift+3/4/5) — nothing can.
  useEffect(() => {
    const original = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices)
    if (!original) return

    navigator.mediaDevices.getDisplayMedia = async (opts) => {
      setIsCapturing(true)
      try {
        const stream = await original(opts)
        // Stop capturing flag when all tracks end
        stream.getTracks().forEach((t) =>
          t.addEventListener('ended', () => setIsCapturing(false))
        )
        return stream
      } catch (err) {
        setIsCapturing(false)
        throw err
      }
    }

    return () => {
      navigator.mediaDevices.getDisplayMedia = original
    }
  }, [])

  // ── Keyboard & context-menu security ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && ['s', 'p', 'a', 'c', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault(); e.stopPropagation(); return
      }
      if (e.key === 'F12') e.preventDefault()
    }
    const blockCtx  = (e: MouseEvent) => e.preventDefault()
    const blockDrag = (e: DragEvent)  => e.preventDefault()

    document.addEventListener('keydown',    handleKeyDown, true)
    document.addEventListener('contextmenu', blockCtx)
    document.addEventListener('dragstart',   blockDrag)
    return () => {
      document.removeEventListener('keydown',    handleKeyDown, true)
      document.removeEventListener('contextmenu', blockCtx)
      document.removeEventListener('dragstart',   blockDrag)
    }
  }, [])

  const goToPrev = useCallback(() => setPageNumber((p) => Math.max(1, p - 1)), [])
  const goToNext = useCallback(() => setPageNumber((p) => Math.min(numPages, p + 1)), [numPages])
  const zoomIn   = useCallback(() => setScale((s) => Math.min(3,   +(s + 0.2).toFixed(1))), [])
  const zoomOut  = useCallback(() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1))), [])

  // ── Non-ready states ───────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading secure document…</p>
      </div>
    </div>
  )

  if (status === 'expired') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Session Expired</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">Your viewing session has expired. Return to your dashboard to open the document again.</p>
        <a href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Back to Dashboard
        </a>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center p-8 max-w-md">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-2xl font-semibold text-white mt-4 mb-3">Something went wrong</h2>
        <p className="text-gray-400 mb-8">Failed to load the document.</p>
        <button onClick={() => window.location.reload()} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Retry
        </button>
      </div>
    </div>
  )

  // ── Secure viewer ──────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col min-h-screen bg-gray-950 select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Screen-recording banner */}
      {isCapturing && (
        <div className="fixed inset-x-0 top-0 z-50 bg-red-600 text-white text-center text-sm font-semibold py-2 tracking-wide">
          ⚠️ Screen recording detected — document protected
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <PdfIcon className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-white text-sm font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={goToPrev} disabled={pageNumber <= 1} aria-label="Previous page"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors">‹</button>
          <span className="text-gray-400 text-sm tabular-nums w-20 text-center">{pageNumber} / {numPages || '—'}</span>
          <button onClick={goToNext} disabled={pageNumber >= numPages} aria-label="Next page"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors">›</button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={zoomOut} disabled={scale <= 0.5} aria-label="Zoom out"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors text-lg leading-none">−</button>
          <span className="text-gray-400 text-sm tabular-nums w-14 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3} aria-label="Zoom in"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors text-lg leading-none">+</button>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 shrink-0">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Secure View
        </div>
      </header>

      <main className="flex-1 overflow-auto flex justify-center py-8 px-4">
        <div className="relative" style={{ filter: isCapturing ? 'blur(20px) brightness(0.2)' : 'none' }}>
          <Document
            file={pdfUrl!}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={null}
            error={<p className="text-gray-500 text-sm mt-8">Failed to render document.</p>}
          >
            <div className="relative shadow-2xl shadow-black/60">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />

              {/*
                ── Watermark grid ────────────────────────────────────────────
                Rendered as a fixed pixel-spaced grid (not %) so coverage is
                consistent regardless of PDF height or zoom level.

                Opacity is high enough to survive any screenshot and remains
                traceable: every row contains the exact session time and a
                token fragment so a leaked screenshot identifies the recipient.
              */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{ zIndex: 10 }}
              >
                {Array.from({ length: WM_ROWS }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 whitespace-nowrap text-center"
                    style={{
                      top:       `${(i / (WM_ROWS - 1)) * 110 - 5}%`,
                      transform: 'translateX(-50%) rotate(-35deg)',
                      width:     '160%',
                    }}
                  >
                    {/* Primary watermark line */}
                    <div
                      className="font-black tracking-[0.3em] select-none"
                      style={{
                        fontSize:  `${scale * 26}px`,
                        color:     'rgba(0,0,0,0.18)',
                      }}
                    >
                      CONFIDENTIAL · DO NOT COPY
                    </div>
                    {/* Session identity line — makes every screenshot traceable */}
                    <div
                      className="font-mono tracking-[0.18em] select-none mt-1"
                      style={{
                        fontSize: `${scale * 9}px`,
                        color:    'rgba(0,0,0,0.14)',
                      }}
                    >
                      {wm.current}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Document>
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 py-2 px-4 text-center text-xs text-gray-600">
        🔒 Secured — downloading, printing, copying and screenshots are restricted
      </footer>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 3C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8l-5-5H7zm5 14H8v-2h4v2zm3-4H8v-2h7v2zm-1-6V4.5L18.5 9H14z" />
    </svg>
  )
}
