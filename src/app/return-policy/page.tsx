import type { Metadata } from "next";
import { ContactDetails, Placeholder, PolicyLink, PolicyPage, type PolicySection } from "@/components/policies/PolicyPage";
import { policyConfig } from "@/config/policies";

export const metadata: Metadata = { title: "Return Policy" };

const { windowDays, eligibleCategoryLabel } = policyConfig.returns;

// The 10-day return option is limited to eligible women's apparel (config/policies.ts). Every other
// category still has the problem-report route; nothing here removes statutory rights.
const sections: PolicySection[] = [
  {
    id: "summary",
    title: "Who this applies to",
    content: (
      <>
        <p>
          A <strong>{windowDays}-day return option applies only to eligible {eligibleCategoryLabel}</strong>. The return period starts on the date the
          order is delivered.
        </p>
        <p>
          It does <strong>not</strong> apply to fruits, vegetables, groceries, fertilizers, combo boxes or any other category. For those, see
          “Problems with any product” below.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility conditions",
    content: (
      <>
        <p>A return request for {eligibleCategoryLabel} can be accepted when:</p>
        <ul>
          <li>the item belongs to the eligible {eligibleCategoryLabel} category;</li>
          <li>the request is made within {windowDays} days of the delivery date;</li>
          <li>the item is unused, unwashed and unaltered, in its original condition;</li>
          <li>tags, labels, any accessories and the original packaging are retained, where applicable;</li>
          <li>proof of purchase (your order ID) is provided.</li>
        </ul>
        <p>
          Items excluded from returns even within apparel: <Placeholder>[for example innerwear or items marked non-returnable on the listing — to be confirmed]</Placeholder>.
          These conditions are provisional and will be confirmed before the service launches.
        </p>
      </>
    ),
  },
  {
    id: "request",
    title: "How to request a return",
    content: (
      <ol>
        <li>Contact customer support within {windowDays} days of delivery with your order ID, the item and its size, and the reason for return.</li>
        <li>Add photos of the item, tags and packaging if asked.</li>
        <li>Keep the item in its original condition until the return is complete.</li>
      </ol>
    ),
  },
  {
    id: "review",
    title: "Review and pickup",
    content: <p>We review each request against the conditions above and tell you whether it is accepted. If accepted, we will arrange a pickup or explain how to send the item back. Pickup arrangements and any return charges: <Placeholder>[to be confirmed]</Placeholder>.</p>,
  },
  {
    id: "resolution",
    title: "Resolution",
    content: (
      <p>
        Once the returned item has been received and checked, we will offer a resolution such as an exchange for another size (where available) or a
        refund to the original payment method. A refund is complete only once it has been processed and you have been informed; processing
        timelines: <Placeholder>[to be confirmed]</Placeholder>. If the item does not meet the conditions, we will explain why and arrange for it to be
        sent back to you.
      </p>
    ),
  },
  {
    id: "problems",
    title: "Problems with any product",
    content: (
      <p>
        Whatever you bought, including perishable items, you can report an incorrect, damaged, defective, missing or materially misdescribed product.
        Report it as soon as possible after delivery. Each report is reviewed and resolved as set out in the{" "}
        <PolicyLink href="/cancellation-refund-policy">Cancellation and Refund Policy</PolicyLink> and as required by applicable law. Not offering a
        routine return for a category does not take away your statutory rights.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: <ContactDetails />,
  },
];

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      href="/return-policy"
      title="Return Policy"
      summary={<p>Eligible {eligibleCategoryLabel} can be returned within {windowDays} days of delivery. Other categories have no routine return, but problems with any product are always reviewed.</p>}
      sections={sections}
    />
  );
}
