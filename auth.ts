import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { DevicePendingError, DeviceRejectedError } from '@/lib/auth-errors'
import { parseDeviceName } from '@/lib/device-name'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: persist user fields into token
        token.id = user.id
        token.role = (user as { role: string }).role
        token.deviceId = (user as { deviceId?: string }).deviceId
        return token
      }

      // On every subsequent auth() call, verify device is still APPROVED
      if (token.deviceId && token.role !== 'ADMIN') {
        const device = await prisma.deviceSession.findUnique({
          where: {
            userId_deviceId: {
              userId: token.id as string,
              deviceId: token.deviceId as string,
            },
          },
          select: { status: true },
        })
        if (!device || device.status !== 'APPROVED') {
          // Returning null invalidates the JWT → session becomes null → redirect to login
          return null
        }
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.deviceId = token.deviceId as string | undefined
      }
      return session
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        deviceId: { label: 'Device ID', type: 'text' },
        userAgent: { label: 'User Agent', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        console.log('[auth] user found:', user?.email ?? 'null')

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        console.log('[auth] password valid:', valid)

        if (!valid) return null

        // ADMIN accounts skip device check entirely
        if (user.role === 'ADMIN') {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        // Non-browser clients without deviceId are blocked
        const deviceId = credentials.deviceId as string | undefined
        if (!deviceId) return null

        const userAgent = (credentials.userAgent as string | undefined) ?? ''
        const deviceName = parseDeviceName(userAgent)

        const existing = await prisma.deviceSession.findUnique({
          where: { userId_deviceId: { userId: user.id, deviceId } },
        })

        if (!existing) {
          // First time seeing this device — register as PENDING
          await prisma.deviceSession.create({
            data: {
              userId: user.id,
              deviceId,
              deviceName,
              userAgent,
              status: 'PENDING',
            },
          })
          throw new DevicePendingError()
        }

        if (existing.status === 'PENDING') {
          throw new DevicePendingError()
        }

        if (existing.status === 'REJECTED') {
          throw new DeviceRejectedError()
        }

        if (existing.status === 'REVOKED') {
          // Re-register as PENDING
          await prisma.deviceSession.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              requestedAt: new Date(),
              revokedAt: null,
            },
          })
          throw new DevicePendingError()
        }

        // APPROVED — update lastLoginAt and allow login
        await prisma.deviceSession.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          deviceId,
        }
      },
    }),
  ],
})
