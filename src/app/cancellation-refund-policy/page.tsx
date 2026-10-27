import type { Metadata } from "next";
import { ContactDetails, Placeholder, PolicyLink, PolicyPage, type PolicySection } from "@/components/policies/PolicyPage";
import { canRequestCancellation, policyConfig } from "@/config/policies";
import { orderStatusDescriptions, orderStatusLabels } from "@/lib/orders";
import { orderStatuses } from "@/types/order";

export const metadata: Metadata = { title: "Cancellation and Refund Policy" };

const packed = orderStatusLabels[policyConfig.cancellation.packedStatus];

// Intended rules: no customer cancellation once packed; refunds are not routine but are reviewed for
// the listed problems and given where the law or payment rules require. No timelines are promised.
const sections: PolicySection[] = [
  {
    id: "lifecycle",
    title: "How an order progresses",
    content: (
      <>
        <p>Every order moves through these statuses, which you can follow on its tracking page:</p>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="bg-soft text-xs tracking-wide text-muted-foreground uppercase">
              <tr><th scope="col" className="px-4 py-2.5 font-semibold">Status</th><th scope="col" className="px-4 py-2.5 font-semibold">What it means</th><th scope="col" className="px-4 py-2.5 font-semibold">Can you ask to cancel?</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orderStatuses.map((status) => (
                <tr key={status}>
                  <th scope="row" className="px-4 py-2.5 font-medium text-foreground">{orderStatusLabels[status]}</th>
                  <td className="px-4 py-2.5">{orderStatusDescriptions[status]}</td>
                  <td className="px-4 py-2.5">{canRequestCancellation(status) ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>“{packed}” is the packed status: from that point the order has been packed for delivery.</p>
      </>
    ),
  },
  {
    id: "cancel-before",
    title: "Cancelling before your order is packed",
    content: (
      <>
        <p>
          You may request cancellation while the order is “{orderStatusLabels.order_placed}”, “{orderStatusLabels.order_confirmed}” or
          “{orderStatusLabels.preparing}”, by contacting customer support with your order ID. If the order has not been packed when the request is
          processed, it will be cancelled and any amount you paid for it refunded to the original payment method.
        </p>
        <p>
          Online self-service cancellation is not yet available on the website; please use the support details below. If your order reaches
          “{packed}” before the request is processed, the request cannot be accepted.
        </p>
      </>
    ),
  },
  {
    id: "cancel-after",
    title: "After your order is packed",
    content: (
      <>
        <p>
          Once an order reaches “{packed}”, customer-initiated cancellation is not permitted, because it has already been prepared and packed,
          often with perishable items. This does not affect any right you have under applicable law, or the review of problems described in this
          policy.
        </p>
        <p>
          If you believe your order was marked packed incorrectly, or something else went wrong (for example, the wrong items were packed), contact
          support with your order ID and we will look into it.
        </p>
      </>
    ),
  },
  {
    id: "by-us",
    title: "Cancellations by Mithren Agro or the seller",
    content: <p>An order, or part of it, may be cancelled by us or the seller if a product becomes unavailable, a price was shown incorrectly, the address cannot be served, or misuse is suspected. You will be told, and any amount paid for the cancelled items will be refunded.</p>,
  },
  {
    id: "refunds",
    title: "Refunds",
    content: (
      <>
        <p>
          Refunds are not offered routinely, for example for a change of mind on products that have no return option. However, we review the
          following situations and, where the review confirms the problem, provide a suitable resolution, which may be a replacement, a refund of the
          affected item, or another remedy:
        </p>
        <ul>
          <li>you received an incorrect product or option (for example, the wrong weight or size);</li>
          <li>a product arrived damaged;</li>
          <li>an item was missing from the order;</li>
          <li>a product is defective;</li>
          <li>a product is materially different from its description;</li>
          <li>a payment failed but money was deducted, or you were charged twice;</li>
          <li>any other case where a refund is required by applicable law or payment-network rules.</li>
        </ul>
        <p>
          Perishable items are reviewed like any other: report a problem as soon as possible after delivery, with photos where you can, so it can be
          assessed. A report is not automatically approved or refused; you will be told the outcome.
        </p>
      </>
    ),
  },
  {
    id: "how",
    title: "How to report a problem",
    content: (
      <ol>
        <li>Contact customer support with your order ID, the affected item and a short description.</li>
        <li>Include clear photos of the product and packaging where relevant (for damaged, incorrect or misdescribed items).</li>
        <li>Keep the product and packaging until the review is complete, unless told otherwise.</li>
        <li>We review the report, may ask for more information, and tell you the outcome and next steps.</li>
      </ol>
    ),
  },
  {
    id: "processing",
    title: "Refund processing",
    content: (
      <p>
        Approved refunds are made to the original payment method unless another method is agreed with you. A refund is complete only once it has
        been processed and you have been informed; timing also depends on your bank or payment provider. Processing timelines:{" "}
        <Placeholder>[to be confirmed with the payment provider]</Placeholder>. In the current preview no payments are taken, so no refunds arise.
      </p>
    ),
  },
  {
    id: "related",
    title: "Returns",
    content: <p>Routine returns are available only for eligible {policyConfig.returns.eligibleCategoryLabel}; see the <PolicyLink href="/return-policy">Return Policy</PolicyLink>.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    content: <ContactDetails />,
  },
];

export default function CancellationRefundPolicyPage() {
  return (
    <PolicyPage
      href="/cancellation-refund-policy"
      title="Cancellation and Refund Policy"
      summary={
        <p>
          You can ask to cancel an order until it is packed (status “{packed}”). Refunds are not routine, but incorrect, damaged, missing,
          defective or misdescribed items and payment errors are always reviewed.
        </p>
      }
      sections={sections}
    />
  );
}
