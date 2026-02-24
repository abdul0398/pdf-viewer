import { auth } from '../../../../../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ManageSharesClient from './ManageSharesClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ManagePdfPage({ params }: Props) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params

  const [upload, allUsers] = await Promise.all([
    prisma.pdfUpload.findUnique({
      where: { id },
      include: {
        shares: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { sharedAt: 'desc' },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!upload) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </a>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-300 truncate max-w-xs">{upload.originalName}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1 break-words">{upload.originalName}</h1>
          <p className="text-gray-500 text-sm">
            {(upload.fileSize / 1024 / 1024).toFixed(2)} MB ·{' '}
            Uploaded {new Date(upload.createdAt).toLocaleDateString()}
          </p>
        </div>

        <ManageSharesClient
          uploadId={id}
          initialShares={upload.shares.map((s) => ({
            ...s,
            sharedAt: s.sharedAt.toISOString(),
            revokedAt: s.revokedAt?.toISOString() ?? null,
          }))}
          allUsers={allUsers}
        />
      </div>
    </main>
  )
}
