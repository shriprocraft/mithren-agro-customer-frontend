// Customer support contact details, shown on the Help & support page (Contact us) and the policy pages.

/** The customer support inbox. */
export const supportEmail = "support@mithrenagro.in";

/**
 * Opens the customer's mail app with the support address, a subject and the start of a message filled in.
 * (%0D%0A is a line break in the message body.)
 */
export const supportMailto =
  `mailto:${supportEmail}?subject=Customer%20Support%20Inquiry%20-%20Mithren%20Agro` +
  "&body=Hi%20Mithren%20Agro%20Team,%0D%0A%0D%0AI%20need%20help%20with:%20";

/**
 * The support WhatsApp number in international format without "+" or spaces (e.g. "919876543210"), or
 * null while none has been provided. The WhatsApp button appears on the Contact us card once it is set.
 */
export const supportWhatsApp: string | null = null;

/** Opens a WhatsApp chat with support, with a greeting filled in. */
export const supportWhatsAppLink = (number: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent("Hi Mithren Agro Team, I need help with: ")}`;
