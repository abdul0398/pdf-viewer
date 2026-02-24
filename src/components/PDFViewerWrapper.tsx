'use client'

import dynamic from 'next/dynamic'

// pdfjs-dist references browser-only globals (DOMMatrix) at module load time,
// so the import must be deferred to the client only.
const SecurePDFViewer = dynamic(() => import('./SecurePDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function PDFViewerWrapper(props: {
  viewToken: string
  serverFileName: string
}) {
  return <SecurePDFViewer {...props} />
}
