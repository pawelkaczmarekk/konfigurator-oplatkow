const ALLOWED_DOMAINS = ['cakedecor.pl'];

const ALLOWED_EMAILS = [
  'pawelkaczmarekk@gmail.com',
  'franciszkowskirobert@gmail.com',
] as const;

export function isAllowedEmail(email: string): boolean {
  if ((ALLOWED_EMAILS as readonly string[]).includes(email)) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}