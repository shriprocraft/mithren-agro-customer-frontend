import type { Metadata } from "next";
import { ContactDetails, Placeholder, PolicyLink, PolicyPage, type PolicySection } from "@/components/policies/PolicyPage";
import { orderStatusLabels } from "@/lib/orders";

export const metadata: Metadata = { title: "Shipping Policy" };

// No delivery times, charges, areas or cold-chain capability are promised: none have been confirmed.
const sections: PolicySection[] = [
  {
    id: "areas",
    title: "Serviceable locations",
    content: (
      <p>
        We deliver only to areas that we and our sellers can serve. Choose your area with the location selector at the top of the website; once the service is live,
        delivery will be offered at checkout only to serviceable PIN codes. Serviceable areas: <Placeholder>[list or map of areas — to be confirmed]</Placeholder>.
        In the current preview, areas are shown for illustration and no deliveries are made.
      </p>
    ),
  },
  {
    id: "estimates",
    title: "Delivery availability and estimates",
    content: <p>Delivery slots and estimated delivery times, where shown, depend on your area, the sellers in your order, order volume and conditions on the day. They are estimates, not guarantees. Delivery days and time slots: <Placeholder>[to be confirmed]</Placeholder>.</p>,
  },
  {
    id: "charges",
    title: "Delivery charges",
    content: <p>Any delivery or handling charge is shown at checkout before you place your order. No delivery charges are configured in the current preview. Charges and any free-delivery threshold: <Placeholder>[to be confirmed]</Placeholder>.</p>,
  },
  {
    id: "processing",
    title: "Order processing",
    content: (
      <p>
        After you place an order, the seller confirms it (“{orderStatusLabels.order_confirmed}”), prepares and packs it
        (“{orderStatusLabels.preparing}”, then “{orderStatusLabels.ready_for_dispatch}”), and it is handed to a delivery agent
        (“{orderStatusLabels.out_for_delivery}”) until it is “{orderStatusLabels.delivered}”. An order with items from several sellers may arrive in
        more than one delivery.
      </p>
    ),
  },
  {
    id: "packaging",
    title: "Packaging and perishable goods",
    content: (
      <p>
        Products are packed to protect them in transit. Fresh produce and other perishable items are packed and delivered with care, but we do not
        currently claim temperature-controlled (cold-chain) handling. Please check perishables on delivery and refrigerate or store them as
        appropriate. Packaging standards: <Placeholder>[to be confirmed]</Placeholder>.
      </p>
    ),
  },
  {
    id: "updates",
    title: "Delivery status updates",
    content: <p>You can follow each order’s status on its tracking page and in My Orders. Status updates are provided by the seller and delivery agent; in the current preview, tracking is simulated.</p>,
  },
  {
    id: "availability",
    title: "Being available to receive your order",
    content: <p>Please make sure someone is available at the address to receive the order and that the mobile number is reachable. The delivery agent may call you to find the address or hand over the order.</p>,
  },
  {
    id: "address",
    title: "Incorrect or incomplete addresses",
    content: <p>Check your delivery address and PIN code before placing an order. If an address is incorrect or incomplete, the delivery may be delayed or fail. Contact support as soon as possible if you notice a mistake; changes may not be possible once the order is out for delivery.</p>,
  },
  {
    id: "failed",
    title: "Failed delivery attempts",
    content: <p>If an order cannot be delivered because no one was available, the address was incorrect, or the order was refused, the delivery agent may try again or the order may be returned to the seller. How re-delivery, perishable items and any charges are handled in that case: <Placeholder>[to be confirmed]</Placeholder>.</p>,
  },
  {
    id: "delays",
    title: "Delays",
    content: <p>Deliveries can be delayed by weather, traffic, high demand, supply problems or other events outside our control. We will keep the status up to date and, where possible, let you know about significant delays.</p>,
  },
  {
    id: "issues",
    title: "Missing or damaged products",
    content: <p>If an item is missing or arrives damaged, report it to support as soon as possible after delivery, with your order ID and photos where possible. It will be reviewed as described in the <PolicyLink href="/cancellation-refund-policy">Cancellation and Refund Policy</PolicyLink>.</p>,
  },
  {
    id: "contact",
    title: "Support and complaints",
    content: (
      <>
        <p>For delivery questions or complaints, contact:</p>
        <ContactDetails />
      </>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      href="/shipping-policy"
      title="Shipping Policy"
      summary={<p>Where we deliver, how orders are processed and delivered, and what happens if a delivery is delayed, fails or arrives with a problem.</p>}
      sections={sections}
    />
  );
}
