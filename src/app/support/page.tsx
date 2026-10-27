import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { BackToAccountLink } from "@/components/account/BackToAccountLink";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { FaqList, type Faq } from "@/components/opportunities/FaqList";
import { Heading } from "@/components/ui/typography";
import { policyConfig } from "@/config/policies";
import { orderStatusLabels } from "@/lib/orders";

export const metadata: Metadata = { title: "Help & support" };

// Answers describe what this preview actually does. No phone number, email, address, refund promise
// or delivery promise is given: none has been supplied, so the contact section says so.
const groups: { title: string; faqs: Faq[] }[] = [
  {
    title: "Orders and tracking",
    faqs: [
      { q: "Where can I see my orders?", a: <>In <Link href="/account/orders" className="font-medium text-primary underline-offset-4 hover:underline">My Orders</Link>, or from the account menu in the header. Orders are saved in the browser they were placed in.</> },
      { q: "How do I track an order?", a: <>Use “Track order” on the confirmation page or in My Orders, or enter the order ID in <Link href="/account/track" className="font-medium text-primary underline-offset-4 hover:underline">Track Orders</Link>. In this preview the stages are simulated: no seller or delivery partner is connected, so there is no live location or delivery estimate.</> },
      { q: "Is my order real?", a: "No. This is a preview storefront: no payment is taken, no seller is notified and nothing is delivered. Orders marked “Sample order” were added by the demo account." },
    ],
  },
  {
    title: "Addresses and checkout",
    faqs: [
      { q: "Do I need an account to check out?", a: "No. You can check out as a guest: add a delivery address at checkout and it is saved in this browser for next time." },
      { q: "How do I change my default address?", a: <>In <Link href="/account/addresses" className="font-medium text-primary underline-offset-4 hover:underline">My Addresses</Link>, choose “Set as default”. Checkout preselects it.</> },
      { q: "Are delivery charges or taxes added?", a: "Not in this preview. No delivery, tax or discount rules are configured, so the total is the sum of the items." },
    ],
  },
  {
    title: "Your account",
    faqs: [
      { q: "What is the demo account?", a: "A sample account that shows how orders, addresses and settings will work. It uses fictional data, needs no password and is stored only in this browser. It is not a secure sign-in." },
      { q: "How do I reset or leave the demo?", a: <>Use “Reset demo data” or “Logout” in <Link href="/account/settings" className="font-medium text-primary underline-offset-4 hover:underline">Account Settings</Link>. Clearing this site’s data in your browser removes everything.</> },
    ],
  },
  {
    title: "Returns, refunds and cancellations",
    faqs: [
      { q: "Can I cancel an order?", a: <>You can ask to cancel until the order is packed (status “{orderStatusLabels[policyConfig.cancellation.packedStatus]}”). See the <Link href="/cancellation-refund-policy" className="font-medium text-primary underline-offset-4 hover:underline">Cancellation and Refund Policy</Link>.</> },
      { q: "Which products can be returned?", a: <>Eligible {policyConfig.returns.eligibleCategoryLabel} can be returned within {policyConfig.returns.windowDays} days of delivery. Other categories have no routine return, but you can always report an incorrect, damaged, missing or defective item. See the <Link href="/return-policy" className="font-medium text-primary underline-offset-4 hover:underline">Return Policy</Link>.</> },
      { q: "Are these policies final?", a: "Not yet. The policy pages are drafts awaiting legal review and some details (contacts, timelines, charges) are still to be added." },
    ],
  },
];

export default function SupportPage() {
  return (
    <main id="main-content" className="flex-1">
      <Container className="max-w-4xl pt-4 pb-10 sm:pt-6 lg:pt-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help & support" }]} />
        <div className="mt-2"><BackToAccountLink /></div>
        <Heading as="h1" variant="h1" className="mt-2 text-[1.625rem] sm:text-4xl">Help &amp; support</Heading>
        <p className="mt-2 text-muted-foreground">Answers about orders, tracking, addresses and the demo account.</p>

        <div id="faqs" className="mt-8 scroll-mt-6 space-y-8 lg:scroll-mt-36">
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={`faq-${group.title}`}>
              <h2 id={`faq-${group.title}`} className="font-heading text-lg font-semibold">{group.title}</h2>
              <div className="mt-3"><FaqList faqs={group.faqs} /></div>
            </section>
          ))}

          <section id="contact" aria-labelledby="contact-title" className="scroll-mt-6 lg:scroll-mt-36 flex gap-4 rounded-3xl bg-soft p-5 ring-1 ring-border sm:p-6">
            <LifeBuoy className="size-6 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 id="contact-title" className="font-heading text-lg font-semibold">Contact us</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Official customer support contact details will be added here before launch. This preview has no support phone line or email address yet.
              </p>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
