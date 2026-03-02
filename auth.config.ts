import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.deviceId = (user as { deviceId?: string }).deviceId
        token.mobileVerified = (user as { mobileVerified?: boolean }).mobileVerified ?? false
        token.color = (user as { color?: string | null }).color ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.deviceId = token.deviceId as string | undefined
        session.user.mobileVerified = (token.mobileVerified as boolean | undefined) ?? false
        session.user.color = token.color as string | null | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig
