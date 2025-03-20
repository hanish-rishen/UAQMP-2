import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicPath = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/gemini",
  "/map",
]);

// Define protected routes
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/profile(.*)"]);

// Export the clerk middleware
export default clerkMiddleware((auth, req) => {
  const path = req.nextUrl.pathname;

  // Allow access to public paths
  if (isPublicPath(req)) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (isProtectedRoute(req)) {
    try {
      // This will throw an error if user is not authenticated
      auth.protect();
    } catch {
      // Redirect to sign-in if accessing protected paths while not authenticated
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      signInUrl.searchParams.set("redirect_url", path);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Continue for authenticated users or non-specified routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
