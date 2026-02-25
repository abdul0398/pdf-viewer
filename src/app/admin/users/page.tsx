import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CreateUserForm from '@/components/CreateUserForm'
import UserList from '@/components/UserList'

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </a>
          <span className="text-xs text-gray-500">{session.user.email}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manage Users</h1>
          <p className="text-gray-400 text-sm">Create and view users who can upload PDFs.</p>
        </div>

        <CreateUserForm />

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">All Users</h2>
          <UserList initialUsers={serializedUsers} />
        </div>
      </div>
    </main>
  )
}
