const ALLOWED_EMAILS = [
  'pawelkaczmarekk@gmail.com',
  'franciszkowskirobert@gmail.com',
  'cakedecor.pl@gmail.com',
] as const;

export function isAllowedEmail(email: string): boolean {
  return (ALLOWED_EMAILS as readonly string[]).includes(email);
}