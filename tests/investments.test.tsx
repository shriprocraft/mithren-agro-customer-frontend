import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestmentSelector } from "@/components/opportunities/InvestmentSelector";
import { AppProviders } from "@/context/AppProviders";
import { allocationRules, investmentDomains, investmentPlans, investmentProjects } from "@/data/investments";
import { planEligibility, projectsByDomain, selectionHref, validateSelection } from "@/lib/investments";

let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/investors/plan",
  useSearchParams: () => search,
}));

describe("investment data", () => {
  it("has six domains with two projects each: 12 projects", () => {
    expect(investmentDomains.map((d) => d.name)).toEqual([
      "Crop Production", "Dairy Farming", "Fish Farming", "Poultry Farming", "Biogas & Composting", "Agri Forestry",
    ]);
    expect(investmentProjects).toHaveLength(12);
    for (const { projects } of projectsByDomain()) expect(projects).toHaveLength(2);
    expect(new Set(investmentProjects.map((p) => p.id)).size).toBe(12);
  });

  it("offers exactly the five contribution amounts, with no custom plan", () => {
    expect(investmentPlans.map((p) => p.amount)).toEqual([1_000_00, 10_000_00, 25_000_00, 50_000_00, 1_00_000_00]);
    expect(JSON.stringify(investmentPlans)).not.toMatch(/custom/i);
  });

  it("invents nothing: unconfirmed durations, eligibility and rules stay null, placeholders are labelled", () => {
    for (const plan of investmentPlans) expect(plan.duration).toBeNull();
    for (const project of investmentProjects) {
      expect(project.eligible_plan_ids).toBeNull();
      expect(project.location).toBeNull();
      expect(project.is_placeholder).toBe(true);
      expect(project.summary).toMatch(/^Placeholder/);
    }
    expect(allocationRules).toEqual({ projects_per_plan: null, plans_combinable: null });
    const all = JSON.stringify({ investmentDomains, investmentPlans, investmentProjects });
    expect(all).not.toMatch(/%|return|profit|guarantee|interest|maturity|payout/i);
  });

  it("only answers eligibility from a confirmed list", () => {
    const project = investmentProjects[0]!;
    expect(planEligibility(project, "plan-1000")).toBe("unconfirmed");
    expect(planEligibility({ ...project, eligible_plan_ids: ["plan-1000"] }, "plan-1000")).toBe("eligible");
    expect(planEligibility({ ...project, eligible_plan_ids: ["plan-1000"] }, "plan-50000")).toBe("not_eligible");
  });

  it("validates a selection", () => {
    expect(validateSelection(null, null)).toEqual({ plan: "Choose a contribution amount.", project: "Choose a project." });
    expect(validateSelection("plan-1000", "nope")).toEqual({ project: "Choose a project." });
    expect(validateSelection("plan-1000", "crop-production-1")).toEqual({});
    expect(selectionHref({ plan: "plan-1000", project: "crop-production-1" })).toBe("/investors/plan?plan=plan-1000&project=crop-production-1");
  });
});

function renderSelector() {
  return render(
    <AppProviders>
      <InvestmentSelector domains={investmentDomains} projects={investmentProjects} plans={investmentPlans} rules={allocationRules} portalHref={null} />
    </AppProviders>,
  );
}

describe("plan and project selection", () => {
  it("shows field errors and a toast when the selection is incomplete", () => {
    search = new URLSearchParams();
    renderSelector();
    fireEvent.click(screen.getByRole("button", { name: /Review selection/ }));
    expect(screen.getByText("Choose a contribution amount.")).toBeInTheDocument();
    expect(screen.getByText("Choose a project.")).toBeInTheDocument();
    expect(screen.getByText("Your selection isn’t complete")).toBeInTheDocument();
    expect(screen.queryByText(/Preview only/)).toBeNull();
  });

  it("reviews a complete selection without claiming anything was invested", () => {
    search = new URLSearchParams("plan=plan-25000&project=fish-farming-2");
    renderSelector();
    expect(screen.getByRole("radio", { name: /₹25,000/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Fish Farming Project 2" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Review selection/ }));
    const summary = screen.getByRole("complementary", { name: "Review your selection" });
    expect(within(summary).getByText("₹25,000")).toBeInTheDocument();
    expect(within(summary).getByText("Fish Farming Project 2")).toBeInTheDocument();
    expect(within(summary).getAllByText("Awaiting confirmation").length).toBeGreaterThanOrEqual(3);
    expect(within(summary).getByText(/Nothing has been submitted, no payment has been taken and no investment has been made/)).toBeInTheDocument();
    expect(within(summary).getByRole("button", { name: /Investor Portal: coming soon/ })).toBeDisabled();
    expect(document.body.textContent).not.toMatch(/invested successfully|confirmed investment|investment successful/i);
  });

  it("ignores unknown ids in the URL", () => {
    search = new URLSearchParams("plan=plan-999&project=nope");
    renderSelector();
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
  });
});
