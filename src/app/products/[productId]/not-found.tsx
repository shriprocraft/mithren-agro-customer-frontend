import Link from "next/link";
import { PackageX } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="flex flex-col items-center py-20 text-center">
        <PackageX className="size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold">We couldn’t find that product</h1>
        <p className="mt-2 max-w-md text-muted-foreground">The link may be out of date, or the product is no longer listed.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Browse all products</Link>
        </Button>
      </Container>
    </main>
  );
}
