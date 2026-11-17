import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SupportPage from "@/app/support/page";
import { supportEmail, supportMailto, supportWhatsApp } from "@/config/support";

const MAILTO =
  "mailto:support@mithrenagro.in?subject=Customer%20Support%20Inquiry%20-%20Mithren%20Agro&body=Hi%20Mithren%20Agro%20Team,%0D%0A%0D%0AI%20need%20help%20with:%20";

describe("Contact us on the Help & support page", () => {
  it("shows the support email and an Email support button that opens the mail app filled in", () => {
    render(<SupportPage />);
    const contact = screen.getByRole("region", { name: "Contact us" });
    expect(supportEmail).toBe("support@mithrenagro.in");
    expect(supportMailto).toBe(MAILTO);
    expect(within(contact).getByRole("link", { name: "support@mithrenagro.in" })).toHaveAttribute("href", MAILTO);
    expect(within(contact).getByRole("link", { name: "Email support" })).toHaveAttribute("href", MAILTO);
    // The placeholder preview notice is gone.
    expect(contact).not.toHaveTextContent(/will be added here before launch/i);
  });

  it("offers WhatsApp only once a support number is set", () => {
    render(<SupportPage />);
    const contact = screen.getByRole("region", { name: "Contact us" });
    const whatsapp = within(contact).queryByRole("link", { name: /whatsapp/i });
    if (supportWhatsApp) expect(whatsapp).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\/\d+\?text=/));
    else expect(whatsapp).toBeNull();
  });
});
