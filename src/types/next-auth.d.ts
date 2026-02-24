import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: string
    deviceId?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      deviceId?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    deviceId?: string
  }
}
