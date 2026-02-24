import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import UploadForm from '@/components/UploadForm'
import AdminPdfList from '@/components/AdminPdfList'
import UserPdfList from '@/components/UserPdfList'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-sm font-medium text-gray-300">Secure PDF Viewer</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <a
                href="/admin/users"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Manage Users
              </a>
            )}
            <span className="text-xs text-gray-500">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {isAdmin ? (
        <>
          {/* Admin hero */}
          <div className="border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-6 py-12 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
                Admin Dashboard
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Upload &amp; Share{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  PDFs
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                Upload documents and control exactly who can access them.
              </p>
            </div>
          </div>

          {/* Upload section */}
          <div className="border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-6 self-start">Upload PDF</h2>
              <UploadForm />
            </div>
          </div>

          {/* PDF list */}
          <div className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-lg font-semibold mb-6">All PDFs</h2>
            <AdminPdfList />
          </div>
        </>
      ) : (
        <>
          {/* User hero */}
          <div className="border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-6 py-16 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
                Secure PDF Viewer
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Documents
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                PDFs shared with you appear below. Each session lasts 2 hours and can be reopened anytime.
              </p>
            </div>
          </div>

          {/* User PDF list */}
          <div className="max-w-5xl mx-auto px-6 py-12">
            <UserPdfList />
          </div>
        </>
      )}
    </main>
  )
}
