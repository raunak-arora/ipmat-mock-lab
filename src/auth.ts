import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const ADMIN_EMAIL = "raunaknarora098@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      // Admin routes — only require sign-in here; the actual admin check
      // (ADMIN_EMAIL or AllowedAdmin table) runs in src/app/admin/layout.tsx
      // which executes in Node.js and can call Prisma safely.
      if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/denied") return true;
        if (!session?.user) return false;
        return true;
      }

      // Landing page and denied page are public
      if (pathname === "/" || pathname === "/denied") return true;

      // All other routes require any Google sign-in; allowlist is checked in the page
      if (!session?.user) return false;
      return true;
    },
  },
});
