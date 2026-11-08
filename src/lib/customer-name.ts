// The customer's name, as the backend accepts it on PATCH /customer/profile: 2 to 100 characters after
// trimming (docs/BACKEND_CONTRACTS.md). Shared by Account → Profile and the first-sign-in name step.

export const NAME_MAX = 100;

export function nameError(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Enter your full name";
  if (trimmed.length < 2) return "Enter at least 2 characters";
  if (trimmed.length > NAME_MAX) return `Use at most ${NAME_MAX} characters`;
  return undefined;
}
