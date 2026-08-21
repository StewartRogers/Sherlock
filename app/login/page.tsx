import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sherlock — Locked",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main
      className="sh-pad"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
