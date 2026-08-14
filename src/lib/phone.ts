export function formatSyrianPhone(input: string): string {
  const n = input.replace(/[\s\-()]/g, '');
  if (!/^\+9639\d{8}$/.test(n)) return input;
  const national = n.slice(4);
  return `+963 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}
