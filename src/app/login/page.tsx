import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/account/AuthLayout";
import { LoginView } from "@/components/account/LoginView";
import { LoadingState } from "@/components/checkout/PageState";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = { title: "Sign in (demo)", robots: { index: false } };

export default function LoginPage() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="max-w-6xl pt-4 pb-10 sm:pt-8">
        <AuthLayout>
          {/* LoginView reads ?next= and ?signed_out=, so it renders inside this boundary. */}
          <Suspense fallback={<LoadingState label="Loading…" fullHeight />}>
            <LoginView />
          </Suspense>
        </AuthLayout>
      </Container>
    </main>
  );
}
