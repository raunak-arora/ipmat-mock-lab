import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const ADMIN_EMAIL = "raunaknarora098@gmail.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      // Only guard /admin routes.
      if (!pathname.startsWith("/admin")) return true;
      // The "denied" page itself must be publicly reachable.
      if (pathname === "/admin/denied") return true;
      // Not signed in → go to Google login.
      if (!session?.user) return false;
      // Signed in with the wrong account → denied page.
      if (session.user.email !== ADMIN_EMAIL) {
        return Response.redirect(new URL("/admin/denied", request.nextUrl));
      }
      return true;
    },
  },
});
