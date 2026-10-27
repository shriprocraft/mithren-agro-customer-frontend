import type { Metadata } from "next";
import { ContactDetails, Placeholder, PolicyLink, PolicyPage, type PolicySection } from "@/components/policies/PolicyPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

// Facts about the current preview were checked against the code: no analytics, no cookies set by the
// site, no payment provider, no account server; addresses, orders, cart, wishlist and the demo
// profile live in the visitor's browser storage only. The live-service sections describe intended
// practices and must be confirmed (and reviewed by a lawyer, including for the DPDP Act, 2023).

const sections: PolicySection[] = [
  {
    id: "scope",
    title: "Introduction and scope",
    content: (
      <>
        <p>
          This policy explains how {siteConfig.legalName} (“Mithren Agro”, “we”, “us”) handles personal information when you use the Mithren
          Agro website and services to browse, buy and track products.
        </p>
        <p>
          <strong>Current preview.</strong> The website is currently a preview. It has no customer account server and takes no payments. The
          details you enter (such as delivery addresses) and your cart, wishlist, orders and demo account are stored only in your own browser’s
          storage on your device; they are not sent to us. This policy also describes how we intend to handle information once the full service
          is live.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    content: (
      <>
        <ul>
          <li><strong>Account and contact information:</strong> your name, email address and mobile number when you create an account or contact us.</li>
          <li><strong>Delivery addresses:</strong> recipient name, mobile number, address, landmark, city, state and PIN code.</li>
          <li><strong>Orders and transactions:</strong> the products, options (such as weight or size) and quantities you order, order amounts, order status and delivery history.</li>
          <li><strong>Payment information:</strong> when payments are introduced, payments will be processed by a payment service provider. We expect to receive only a confirmation and limited details (such as the payment method type and transaction reference), not your full card or bank credentials.</li>
          <li><strong>Support communications:</strong> messages you send us and the details needed to resolve them.</li>
          <li><strong>Technical information:</strong> our hosting provider may record standard server logs (such as IP address, browser type and the pages requested) to operate and secure the website.</li>
        </ul>
        <p>We ask only for what we need to provide the service. Please don’t share sensitive information (such as health or financial details) that we have not asked for.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    content: (
      <>
        <p>
          The website currently sets no advertising or analytics cookies and uses no third-party analytics. It uses your browser’s local storage to
          remember your cart, wishlist, saved addresses, orders and demo-account settings on your device. You can remove this data at any time by
          clearing this site’s data in your browser.
        </p>
        <p>If we introduce cookies or analytics in future, we will update this policy and, where required, ask for your consent first.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use your information",
    content: (
      <ul>
        <li><strong>Order fulfilment:</strong> to process your order, share the necessary details with the seller and the delivery partner, and keep you updated on its status.</li>
        <li><strong>Payments:</strong> to confirm payments and handle failed or duplicate payments and eligible refunds, through the payment provider.</li>
        <li><strong>Customer support:</strong> to respond to questions, complaints, cancellation and return requests.</li>
        <li><strong>Service operation and security:</strong> to run, maintain and protect the website and prevent misuse or fraud.</li>
        <li><strong>Legal obligations:</strong> to keep records and respond to lawful requests as required by applicable law.</li>
        <li><strong>Marketing:</strong> only if you have chosen to receive offers (see “Marketing preferences”).</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Sellers, delivery partners and other service providers",
    content: (
      <>
        <p>We share personal information only as needed to provide the service:</p>
        <ul>
          <li><strong>Sellers</strong> receive the order details they need to prepare your order.</li>
          <li><strong>Delivery agents and partners</strong> receive your name, delivery address and mobile number to deliver it.</li>
          <li><strong>Payment providers</strong> process payments under their own terms and security standards.</li>
          <li><strong>Technology providers</strong> (such as hosting) process information on our behalf to run the website.</li>
          <li><strong>Authorities</strong>, where disclosure is required by law or to protect rights and safety.</li>
        </ul>
        <p>We do not sell your personal information. The names of the specific providers we use will be listed here: <Placeholder>[list of service providers — to be added]</Placeholder>.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    content: (
      <p>
        We keep personal information only for as long as needed for the purposes above, including order, accounting, tax and dispute-resolution
        records for the periods required by law. Retention periods: <Placeholder>[to be confirmed with legal advice]</Placeholder>. In the current
        preview, information stays in your browser until you clear it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        The website is served over an encrypted connection (HTTPS). In the current preview, your details are not transmitted to or stored on our
        servers. When accounts and server-side storage are introduced, we will use access controls and other reasonable security safeguards
        appropriate to the information. No method of transmission or storage is completely secure, and we will notify affected users and
        authorities of personal-data breaches where the law requires.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    content: (
      <>
        <p>Subject to applicable law, including the Digital Personal Data Protection Act, 2023 once in force, you may:</p>
        <ul>
          <li>ask for a summary of the personal information we hold about you and how it is used;</li>
          <li>ask us to correct, complete or update it;</li>
          <li>ask us to erase it where it is no longer needed, unless we must keep it by law;</li>
          <li>withdraw consent you have given, with effect for the future;</li>
          <li>nominate another person to exercise your rights in the event of death or incapacity;</li>
          <li>raise a grievance with us, and, if unresolved, with the relevant authority.</li>
        </ul>
        <p>To make a request, contact us using the details below. We may need to verify your identity first.</p>
      </>
    ),
  },
  {
    id: "marketing",
    title: "Marketing preferences",
    content: (
      <p>
        We will send offers and promotional messages only if you have opted in, and every message will explain how to opt out. Service messages
        about your orders (confirmations, status updates) are not marketing. The notification settings in the demo account are stored in your
        browser and do not send any messages.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children’s privacy",
    content: (
      <p>
        The service is intended for adults who can enter into a binding contract. We do not knowingly collect personal information from children
        (persons under 18) without verifiable consent from a parent or lawful guardian. If you believe a child has given us personal information,
        please contact us so we can delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: <p>We may update this policy as the service develops. We will post the updated version here with a new “Last updated” date and, for significant changes, give additional notice.</p>,
  },
  {
    id: "contact",
    title: "Contact and grievances",
    content: (
      <>
        <p>For privacy questions, requests or complaints, contact:</p>
        <ContactDetails />
        <p>You can also read answers to common questions on the <PolicyLink href="/support">Help &amp; support</PolicyLink> page.</p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      href="/privacy-policy"
      title="Privacy Policy"
      summary={<p>What personal information Mithren Agro collects, why, who it is shared with, how long it is kept and the choices you have.</p>}
      sections={sections}
    />
  );
}
