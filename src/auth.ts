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

      // Admin routes
      if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/denied") return true;
        if (!session?.user) return false;
        if (session.user.email !== ADMIN_EMAIL)
          return Response.redirect(new URL("/admin/denied", request.nextUrl));
        return true;
      }

      // Student denied page is accessible to any signed-in user
      if (pathname === "/denied") return true;

      // All other routes require any Google sign-in; allowlist is checked in the page
      if (!session?.user) return false;
      return true;
    },
  },
});
