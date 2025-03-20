"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Header() {
  const pathname = usePathname();
  // Remove the unused isSignedIn variable

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="text-xl font-bold">UAQMP</span>
        </Link>

        <nav className="flex items-center gap-6">
          {/* Only show Dashboard link if user is signed in */}
          <SignedIn>
            <Link
              href="/dashboard"
              className={`${
                pathname === "/dashboard" ? "text-green-500" : ""
              } hover:text-green-500`}
            >
              Dashboard
            </Link>
          </SignedIn>

          <SignedIn>
            <Link
              href="/profile"
              className={`${
                pathname === "/profile" ? "text-green-500" : ""
              } hover:text-green-500`}
            >
              My Profile
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
