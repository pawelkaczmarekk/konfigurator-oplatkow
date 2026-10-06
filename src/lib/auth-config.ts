export const ALLOWED_EMAILS = [
  'pawelkaczmarekk@gmail.com',
] as const;

export function isAllowedEmail(email: string): boolean {
  return (ALLOWED_EMAILS as readonly string[]).includes(email);
}