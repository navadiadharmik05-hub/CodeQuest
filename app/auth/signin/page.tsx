'use client';
// app/auth/signin/page.tsx
// Custom NextAuth sign-in page (cyberpunk theme).
// Registered in lib/auth.ts → pages.signIn so NextAuth redirects here
// instead of the default /api/auth/signin.

import { Suspense, useState, FormEvent } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const errorCode    = searchParams.get("error");

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [formErr,  setFormErr]  = useState<string | null>(null);

  const errorMessages: Record<string, string> = {
    OAuthSignin:        "Could not start the OAuth flow. Try again.",
    OAuthCallback:      "OAuth callback failed. Try again.",
    OAuthCreateAccount: "Could not create account via OAuth.",
    EmailCreateAccount: "Could not create account with that email.",
    Callback:           "Sign-in callback error.",
    CredentialsSignin:  "Invalid email or password.",
    Default:            "Something went wrong. Please try again.",
  };
  const errorMsg = errorCode ? (errorMessages[errorCode] ?? errorMessages.Default) : null;

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormErr(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setFormErr(errorMessages.CredentialsSignin);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r24)",
        padding: "40px 36px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "var(--glow-violet)",
      }}>
        {/* Header */}
        <h1 style={{
          fontFamily: "var(--font-game)",
          fontSize: "1.6rem",
          letterSpacing: "0.15em",
          textAlign: "center",
          marginBottom: 8,
        }}>
          CODE<span style={{ color: "var(--violet)" }}>QUEST</span>
        </h1>
        <p style={{ textAlign: "center", color: "var(--ink2)", fontSize: "0.8rem", marginBottom: 32 }}>
          Sign in to start your adventure
        </p>

        {/* Server-side or OAuth error banner */}
        {(errorMsg || formErr) && (
          <div style={{
            background: "rgba(255,71,87,0.12)",
            border: "1px solid var(--red)",
            borderRadius: "var(--r8)",
            padding: "10px 14px",
            color: "var(--red2)",
            fontSize: "0.8rem",
            marginBottom: 20,
          }}>
            {formErr ?? errorMsg}
          </div>
        )}

        {/* GitHub OAuth */}
        <button
          onClick={() => signIn("github", { callbackUrl })}
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--panel2)",
            border: "1px solid var(--border2)",
            borderRadius: "var(--rfull)",
            color: "var(--ink)",
            fontFamily: "var(--font-game)",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          🐙 CONTINUE WITH GITHUB
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          color: "var(--ink3)", fontSize: "0.7rem",
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          OR
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Credentials form */}
        <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.65rem", color: "var(--ink2)", fontFamily: "var(--font-game)", letterSpacing: "0.1em" }}>
              EMAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--r8)",
                padding: "10px 14px",
                color: "var(--ink)",
                fontFamily: "var(--font-code)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.65rem", color: "var(--ink2)", fontFamily: "var(--font-game)", letterSpacing: "0.1em" }}>
              PASSWORD
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border2)",
                borderRadius: "var(--r8)",
                padding: "10px 14px",
                color: "var(--ink)",
                fontFamily: "var(--font-code)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px",
              background: "var(--violetg)",
              border: "none",
              borderRadius: "var(--rfull)",
              color: "#fff",
              fontFamily: "var(--font-game)",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", paddingTop: 80 }}>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
