import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PDFViewerWrapper from '@/components/PDFViewerWrapper'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ViewPage({ params }: Props) {
  const { token } = await params

  const session = await prisma.viewSession.findUnique({
    where: { viewToken: token },
    include: { share: { include: { upload: true } } },
  })

  if (!session || session.expiresAt < new Date()) {
    redirect('/expired')
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <PDFViewerWrapper
        viewToken={token}
        serverFileName={session.share.upload.originalName}
      />
    </main>
  )
}
