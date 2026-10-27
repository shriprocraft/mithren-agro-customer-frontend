import type { Metadata } from "next";
import { ContactDetails, Placeholder, PolicyLink, PolicyPage, type PolicySection } from "@/components/policies/PolicyPage";
import { policyConfig, policyPlaceholders } from "@/config/policies";
import { siteConfig } from "@/config/site";
import { orderStatusLabels } from "@/lib/orders";

export const metadata: Metadata = { title: "Terms and Conditions" };

const packed = orderStatusLabels[policyConfig.cancellation.packedStatus];
const { windowDays, eligibleCategoryLabel } = policyConfig.returns;

// No clause removes statutory consumer rights; liability limits are qualified "to the extent permitted
// by law". Cancellation and return rules come from config/policies.ts, like the other policies.
const sections: PolicySection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    content: (
      <>
        <p>
          These terms govern your use of the Mithren Agro website and the purchase of products through it. The website is operated by{" "}
          {siteConfig.legalName} (<Placeholder>{policyPlaceholders.registeredAddress}</Placeholder>). By using the website or placing an
          order, you agree to these terms and to the policies they refer to.
        </p>
        <p>
          <strong>Current preview.</strong> The website is presently a preview: listings, prices and sellers are sample data, no payment is taken
          and orders are not fulfilled. Orders placed in the preview create no obligation for either party.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: <p>You must be at least 18 years old and able to enter into a legally binding contract under Indian law to place orders. If you use the website on behalf of someone else, you confirm that you are authorised to do so.</p>,
  },
  {
    id: "accounts",
    title: "Your account",
    content: (
      <ul>
        <li>Keep your account and contact details accurate and up to date.</li>
        <li>Keep your sign-in details confidential and tell us promptly about any unauthorised use.</li>
        <li>You are responsible for activity on your account that results from your failure to keep it secure.</li>
        <li>The demo account currently offered is a demonstration with sample data; it is not a secure account and must not be used for real personal information.</li>
      </ul>
    ),
  },
  {
    id: "products",
    title: "Products, options and availability",
    content: (
      <>
        <p>
          Products are offered by independent sellers on the marketplace; each listing names its seller. We aim to describe products, pack sizes and
          options (such as weight, pack or size) accurately. Fresh produce is natural: size, colour and weight can vary within the stated pack, and
          images are illustrative.
        </p>
        <p>
          Availability can change at any time. Each option has its own price and availability, and an option shown as out of stock cannot be ordered.
          Quantities per order may be limited.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Pricing and charges",
    content: (
      <p>
        Prices are shown in Indian Rupees for the selected option. Any delivery fee, handling fee or tax that applies will be shown before you place
        your order; none is configured in the current preview. Delivery and other charges: <Placeholder>[to be confirmed]</Placeholder>. If a
        price is displayed incorrectly because of an obvious error, we may decline or cancel the affected order and will refund any amount paid for it.
      </p>
    ),
  },
  {
    id: "orders",
    title: "Placing and accepting orders",
    content: (
      <>
        <p>
          When you place an order you make an offer to buy the selected products. An order is accepted when it is confirmed by the seller (status
          “{orderStatusLabels.order_confirmed}”). We or the seller may decline or cancel an order, or part of it, for reasons such as unavailability,
          an incorrect price, an undeliverable address or suspected misuse; any amount paid for the cancelled part will be refunded.
        </p>
        <p>Order statuses are: {Object.values(orderStatusLabels).join(" → ")}.</p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    content: (
      <p>
        Online payments, when introduced, will be processed by a third-party payment provider under its own terms. Accepted payment methods:{" "}
        <Placeholder>[to be confirmed]</Placeholder>. We do not store your full card or bank credentials. Failed, duplicate or incorrect charges are
        handled as described in the <PolicyLink href="/cancellation-refund-policy">Cancellation and Refund Policy</PolicyLink>.
      </p>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    content: <p>Delivery is offered to serviceable areas only. Delivery estimates are indicative, not guaranteed. Our <PolicyLink href="/shipping-policy">Shipping Policy</PolicyLink> explains serviceable locations, charges, failed deliveries and delays.</p>,
  },
  {
    id: "perishables",
    title: "Perishable products",
    content: (
      <p>
        Fruits, vegetables and other perishable items should be checked at delivery and stored appropriately afterwards. Please report any problem
        with a perishable item as soon as possible after delivery, so that it can be reviewed while it can still be assessed. Reporting
        window: <Placeholder>[to be confirmed]</Placeholder>.
      </p>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation",
    content: (
      <p>
        You may request cancellation of an order until it reaches the “{packed}” (packed) status. Once an order is packed, customer-initiated
        cancellation is not available, subject to applicable law. Details: <PolicyLink href="/cancellation-refund-policy">Cancellation and Refund Policy</PolicyLink>.
      </p>
    ),
  },
  {
    id: "returns-refunds",
    title: "Returns and refunds",
    content: (
      <p>
        Routine returns are offered only for eligible {eligibleCategoryLabel}, within {windowDays} days of delivery (
        <PolicyLink href="/return-policy">Return Policy</PolicyLink>). For any product, you can report an incorrect, damaged, defective, missing or
        materially misdescribed item; each report is reviewed and resolved as described in our policies and as required by law.
      </p>
    ),
  },
  {
    id: "responsibilities",
    title: "Your responsibilities",
    content: (
      <ul>
        <li>Provide a correct and complete delivery address and a reachable mobile number.</li>
        <li>Be available, or arrange for someone to receive the order, at delivery.</li>
        <li>Use the website lawfully and do not interfere with its operation, attempt unauthorised access or place fraudulent orders.</li>
        <li>Buy for personal use unless a seller’s listing says otherwise.</li>
      </ul>
    ),
  },
  {
    id: "promotions",
    title: "Promotions",
    content: <p>Offers, discounts and coupons are subject to their own stated conditions and validity, may be limited in quantity, and cannot be exchanged for cash unless stated. We may withdraw an offer that is being misused.</p>,
  },
  {
    id: "ip",
    title: "Intellectual property",
    content: <p>The Mithren Agro name, logo, website design and content belong to {siteConfig.legalName} or its licensors. You may not copy, reproduce or use them for commercial purposes without written permission. Product names and images supplied by sellers belong to their respective owners.</p>,
  },
  {
    id: "availability",
    title: "Website availability",
    content: <p>We aim to keep the website available but do not guarantee uninterrupted access. We may suspend, change or withdraw features for maintenance, security or business reasons.</p>,
  },
  {
    id: "liability",
    title: "Liability",
    content: (
      <p>
        To the extent permitted by applicable law, Mithren Agro is not liable for indirect or consequential loss arising from use of the website.
        Nothing in these terms excludes or limits liability that cannot be excluded or limited by law, or your rights as a consumer under the
        Consumer Protection Act, 2019 and the rules made under it.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Governing law and disputes",
    content: (
      <p>
        These terms are governed by the laws of India. Please contact us first so we can try to resolve any concern. Subject to your right to approach
        a consumer commission, disputes will be subject to the courts at <Placeholder>{policyPlaceholders.jurisdiction}</Placeholder>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: <p>We may update these terms. The version published here when you place an order applies to that order.</p>,
  },
  {
    id: "contact",
    title: "Contact and grievance redressal",
    content: <ContactDetails />,
  },
];

export default function TermsPage() {
  return (
    <PolicyPage
      href="/terms-and-conditions"
      title="Terms and Conditions"
      summary={<p>The terms for using the Mithren Agro website and buying products through it, and how they fit with our other policies.</p>}
      sections={sections}
    />
  );
}
