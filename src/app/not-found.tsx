import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="flex flex-col items-center py-20 text-center">
        <Compass className="size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 max-w-md text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/products">Shop all products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to the homepage</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
