import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: string
    deviceId?: string
    mobileVerified?: boolean
    color?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      deviceId?: string
      mobileVerified: boolean
      color?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    deviceId?: string
    mobileVerified?: boolean
    color?: string | null
  }
}
