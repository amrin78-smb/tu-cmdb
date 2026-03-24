import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const res = await query('SELECT * FROM users WHERE email = $1', [credentials.email.toLowerCase()])
        const user = res.rows[0]
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null
        return { id: String(user.id), email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) { token.role = user.role; token.id = user.id }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) { session.user.role = token.role; session.user.id = token.id }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
