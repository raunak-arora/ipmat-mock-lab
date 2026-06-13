export { auth as proxy } from "@/auth";

export const config = {
  // Protect all page routes; skip Next.js internals and API routes (auth handled in handlers)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
