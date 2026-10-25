import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/account/AuthLayout";
import { RegisterView } from "@/components/account/RegisterView";
import { LoadingState } from "@/components/checkout/PageState";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = { title: "Create an account (preview)", robots: { index: false } };

export default function RegisterPage() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="max-w-6xl pt-4 pb-10 sm:pt-8">
        <AuthLayout>
          <Suspense fallback={<LoadingState label="Loading…" fullHeight />}>
            <RegisterView />
          </Suspense>
        </AuthLayout>
      </Container>
    </main>
  );
}
