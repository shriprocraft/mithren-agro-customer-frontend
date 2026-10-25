import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingState } from "@/components/checkout/PageState";
import { Container } from "@/components/layout/Container";

// Every /account page shares the demo-account frame. The account lives in browser storage, so the
// shell is static and the content renders on the client (with a full-height loading state, which also
// keeps navigations here starting at the top; see components/products/ProductDetailSkeleton.tsx).
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main id="main-content" className="flex-1">
      <Container className="pt-4 pb-10 sm:pt-6 lg:pt-8">
        <Suspense fallback={<LoadingState label="Loading your account…" fullHeight />}>
          <AccountShell>{children}</AccountShell>
        </Suspense>
      </Container>
    </main>
  );
}
