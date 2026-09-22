'use client';
// app/auth/error/page.tsx
// Custom NextAuth error page — registered in lib/auth.ts → pages.error.
// Displays a friendly cyberpunk-themed error screen for OAuth failures,
// session expiry, and access-denied scenarios.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_DETAIL: Record<string, { title: string; body: string; icon: string }> = {
  Configuration: {
    icon: "⚙️",
    title: "CONFIGURATION ERROR",
    body: "The authentication provider is misconfigured. Contact the administrator.",
  },
  AccessDenied: {
    icon: "🚫",
    title: "ACCESS DENIED",
    body: "You do not have permission to sign in. Your account may have been suspended.",
  },
  Verification: {
    icon: "🔗",
    title: "LINK EXPIRED",
    body: "The magic link or verification token has expired. Please request a new one.",
  },
  Default: {
    icon: "💀",
    title: "AUTH FAILURE",
    body: "An unexpected error occurred during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode    = searchParams.get("error") ?? "Default";
  const detail       = ERROR_DETAIL[errorCode] ?? ERROR_DETAIL.Default;

  return (
    <div
      className="container"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--red)",
          borderRadius: "var(--r24)",
          padding: "48px 40px",
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          boxShadow: "0 0 24px rgba(255,71,87,0.3), 0 0 60px rgba(255,71,87,0.1)",
        }}
      >
        <span style={{ fontSize: "3rem", display: "block", marginBottom: 16 }}>
          {detail.icon}
        </span>
        <h1
          style={{
            fontFamily: "var(--font-game)",
            fontSize: "1.1rem",
            letterSpacing: "0.15em",
            color: "var(--red)",
            marginBottom: 12,
          }}
        >
          {detail.title}
        </h1>
        <p style={{ color: "var(--ink2)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 32 }}>
          {detail.body}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/auth/signin"
            style={{
              padding: "10px 24px",
              background: "var(--violetg)",
              border: "none",
              borderRadius: "var(--rfull)",
              color: "#fff",
              fontFamily: "var(--font-game)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ↩ TRY AGAIN
          </Link>
          <Link
            href="/"
            style={{
              padding: "10px 24px",
              background: "transparent",
              border: "1px solid var(--border2)",
              borderRadius: "var(--rfull)",
              color: "var(--ink)",
              fontFamily: "var(--font-game)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            🏠 HOME
          </Link>
        </div>

        {/* Error code breadcrumb for debugging */}
        <p style={{ marginTop: 28, color: "var(--ink4)", fontSize: "0.65rem", fontFamily: "var(--font-code)" }}>
          error: {errorCode}
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", paddingTop: 80 }}>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
