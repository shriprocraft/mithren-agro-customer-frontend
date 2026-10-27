import Link from "next/link";
import { ArrowRight, Sprout, Store, UsersRound, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Heading } from "@/components/ui/typography";

// Descriptive highlights, not statistics: no years, farmer or customer counts are claimed.
const highlights: { Icon: LucideIcon; title: string; label: string }[] = [
  { Icon: Sprout, title: "Farm Fresh", label: "Produce" },
  { Icon: Store, title: "One Place", label: "Explore Products" },
  { Icon: UsersRound, title: "Grow Together", label: "Join Our Community" },
];

// Directly after the hero: one compact white panel, copy and "Learn More" on the left, three small
// highlight cards in a row on the right (stacked copy and a 3-column card row on tablets, 1 column of
// horizontal cards on small phones). Kept low so it never competes with the hero.
export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="pt-5 pb-1 sm:pt-7">
      <Container>
        <div className="surface-card grid gap-4 rounded-3xl p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center lg:gap-8 lg:px-7 lg:py-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">About us</p>
            <Heading id="about-title" variant="h2" className="mt-1 text-xl sm:text-2xl">About Mithren Agro</Heading>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Connecting farms, fresh produce, and communities through a convenient agricultural marketplace. Discover quality produce and explore
              opportunities to grow with Mithren Agro.
            </p>
            <Link
              href="/about"
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 border-primary px-5 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Learn More
              <ArrowRight className="size-4" aria-hidden="true" />
              <span className="sr-only"> about Mithren Agro</span>
            </Link>
          </div>
          <ul className="grid gap-2.5 min-[480px]:grid-cols-3 sm:gap-3">
            {highlights.map(({ Icon, title, label }) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-border bg-soft px-3.5 py-3 min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2.5 sm:p-4 lg:flex-row lg:items-center lg:gap-3 lg:px-3.5 lg:py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-primary shadow-[0_4px_12px_-6px_rgb(var(--shadow-tint)/0.4)] sm:size-10">
                  <Icon className="size-4 sm:size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-heading text-base leading-tight font-semibold text-foreground">{title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground sm:text-[0.8125rem]">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
